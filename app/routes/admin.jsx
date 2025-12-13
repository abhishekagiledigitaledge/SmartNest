// app/routes/admin.jsx
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import adminStyles from "../styles/admin.css?url";

export const links = () => [
  {
    rel: "stylesheet",
    href: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
  },
  { rel: "stylesheet", href: adminStyles },
];

export const meta = () => [
  { title: "Parent-Child Collection View" },
  { name: "viewport", content: "width=device-width, initial-scale=1" },
];

export async function loader({ request }) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  const backendUrl =
    process.env.BACKEND_URL ||
    "https://subcollection.allgovjobs.com/backend";

  const res = await fetch(`${backendUrl}/admin-view?shop=${shop}`);
  const response = await res.json();
  const { relations, currentPlan } = response.data || {};

  return json({
    relations: relations || [],
    currentPlan: currentPlan || {},
    shop,
    appUrl: process.env.HOST,
    backendUrl,
  });
}

export default function Admin() {
  const { relations: initialRelations, currentPlan, shop, appUrl, backendUrl } =
    useLoaderData();

  const [relations, setRelations] = useState(initialRelations || []);
  const [syncHint, setSyncHint] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({
    show: false,
    message: "",
    type: "",
  });
  const [syncProgress, setSyncProgress] = useState({ show: false, value: 0 });

  const [syncBtnState, setSyncBtnState] = useState({
    disabled: false,
    label: "Sync Now",
    loading: false,
  });

  const [resetBtnState, setResetBtnState] = useState({
    disabled: false,
    label: "Reset",
    loading: false,
  });

  const confirmationModalRef = useRef(null);
  const confirmMessageRef = useRef(null);
  const confirmBtnRef = useRef(null);
  const modalInstanceRef = useRef(null);
  const evtSourceRef = useRef(null);

  /* ---------------------- INIT MODAL (INP FIX) ---------------------- */
  useEffect(() => {
    if (window.bootstrap?.Modal && confirmationModalRef.current) {
      modalInstanceRef.current = new window.bootstrap.Modal(
        confirmationModalRef.current,
        { backdrop: true, keyboard: true }
      );
    }

    return () => {
      if (evtSourceRef.current) evtSourceRef.current.close();
      if (modalInstanceRef.current) modalInstanceRef.current.dispose();
    };
  }, []);

  /* ---------------------- CONFIRM MODAL ---------------------- */
  const confirmAction = (message, onConfirm) => {
    if (confirmMessageRef.current) {
      confirmMessageRef.current.textContent = message;
    }

    if (confirmBtnRef.current) {
      const btn = confirmBtnRef.current.cloneNode(true);
      confirmBtnRef.current.replaceWith(btn);
      confirmBtnRef.current = btn;
      confirmBtnRef.current.onclick = () => {
        modalInstanceRef.current.hide();
        onConfirm();
      };
    }

    modalInstanceRef.current?.show();
  };

  /* ---------------------- REFRESH DATA ---------------------- */
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`${backendUrl}/admin-view?shop=${shop}`);
      const response = await res.json();
      setRelations(Array.isArray(response.data?.relations) ? response.data.relations : []);
    } finally {
      setIsRefreshing(false);
    }
  };

  /* ---------------------- SYNC PROCESS (INP SAFE) ---------------------- */
  const startSyncProcess = () => {
    setSyncHint(true);
    setSyncProgress({ show: true, value: 0 });
    setSyncBtnState({ disabled: true, label: "Syncing...", loading: true });

    fetch(`${backendUrl}/sync-collections?shop=${shop}`).catch(() => {
      setSyncStatus({
        show: true,
        message: "Failed to start sync.",
        type: "danger",
      });
    });

    const evtSource = new EventSource(
      `${backendUrl}/sync-stream?shop=${shop}`
    );
    evtSourceRef.current = evtSource;

    let lastProgress = 0;

    evtSource.onmessage = (e) => {
      const data = JSON.parse(e.data || "{}");
      const progress = Number(data.progress || 0);

      if (progress - lastProgress < 2 && progress !== 100) return;
      lastProgress = progress;

      requestAnimationFrame(() => {
        setSyncProgress({ show: true, value: progress });
      });

      if (progress >= 100) {
        evtSource.close();
        evtSourceRef.current = null;

        setSyncHint(false);
        setSyncBtnState({ disabled: false, label: "Sync Now", loading: false });
        setSyncStatus({
          show: true,
          message: "Sync completed successfully!",
          type: "success",
        });

        setTimeout(refreshData, 1200);
      }
    };
  };

  /* ---------------------- BUTTON HANDLERS (INP FIX) ---------------------- */
  const handleSync = () => {
    setSyncBtnState((s) => ({
      ...s,
      disabled: true,
      loading: true,
      label: "Preparing...",
    }));

    requestAnimationFrame(() => {
      confirmAction(
        "Are you sure? This will create collections in your Shopify store.",
        startSyncProcess
      );
    });
  };

  const handleReset = () => {
    setResetBtnState((s) => ({
      ...s,
      disabled: true,
      loading: true,
      label: "Preparing...",
    }));

    requestAnimationFrame(() => {
      confirmAction(
        "Are you sure? This will delete all relationships.",
        async () => {
          try {
            await fetch(`${backendUrl}/cleanup-collections?shop=${shop}`);
            await refreshData();
          } finally {
            setResetBtnState({
              disabled: false,
              label: "Reset",
              loading: false,
            });
          }
        }
      );
    });
  };

  /* ---------------------- UI ---------------------- */
  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Parent & Child Collection Relations</h1>

        <div className="header-actions">
          {currentPlan?.name === "Basic" && (
            <a
              href={`${appUrl}/plans?shop=${shop}`}
              className="btn btn-outline-dark"
            >
              Explore Plans
            </a>
          )}

          <button
            className="btn btn-outline-danger"
            onClick={handleReset}
            disabled={resetBtnState.disabled}
          >
            {resetBtnState.label}
          </button>

          <button
            className="btn btn-primary"
            onClick={handleSync}
            disabled={syncBtnState.disabled}
          >
            {syncBtnState.label}
          </button>
        </div>
      </div>

      {syncHint && (
        <div className="text-muted mb-2">
          ⏳ Sync running in background…
        </div>
      )}

      {syncProgress.show && (
        <div className="progress mb-3">
          <div
            className="progress-bar progress-bar-striped progress-bar-animated"
            style={{ width: `${syncProgress.value}%` }}
          >
            {syncProgress.value}%
          </div>
        </div>
      )}

      {syncStatus.show && (
        <div className={`alert alert-${syncStatus.type}`}>
          {syncStatus.message}
        </div>
      )}

      {isRefreshing && <p>Refreshing data…</p>}

      {!relations.length && !isRefreshing && (
        <div className="empty-state">
          <h3>No Collections Found</h3>
        </div>
      )}

      <div className="collections-grid">
        {relations.map((rel, i) => (
          <div key={rel.parent?.id || i} className="collection-card">
            <strong>{rel.parent?.title}</strong>
          </div>
        ))}
      </div>

      {/* Modal */}
      <div
        className="modal fade"
        tabIndex="-1"
        ref={confirmationModalRef}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirm</h5>
              <button className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body" ref={confirmMessageRef} />
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                ref={confirmBtnRef}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
