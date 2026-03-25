import { useNavigate, useLoaderData } from "@remix-run/react";
import {
  Page,
  Card,
  Button,
  Text,
  Banner,
  InlineStack,
  BlockStack,
  Spinner,
  Modal,
  Select,
} from "@shopify/polaris";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "@remix-run/react";
import { InlineGrid } from "@shopify/polaris";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";


/* ===========================
   LOADER (REQUIRED)
=========================== */
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
    query getThemes {
      themes(first: 20) {
        nodes {
          id
          name
          role
        }
      }
    }`
  );

  const responseJson = await response.json();
  const themesRaw = responseJson.data.themes.nodes.map((theme) => ({
    ...theme,
    id: theme.id.split("/").pop(),
  }));

  // Parallel check for App Block support (Online Store 2.0)
  // We check for the existence of templates/collection.json
  const themes = await Promise.all(
    themesRaw.map(async (theme) => {
      try {
        const assetRes = await admin.rest.get({
          path: `themes/${theme.id}/assets`,
        });
        const assetData = await assetRes.json();
        const assets = assetData.assets || [];

        // OS 2.0 themes have JSON templates in the templates/ directory
        const supportsAppBlocks = assets.some(
          (a) => a.key.startsWith("templates/") && a.key.endsWith(".json")
        );

        return { ...theme, supportsAppBlocks };
      } catch (e) {
        console.error(`Error checking assets for theme ${theme.id}:`, e);
        // Fallback to true if we can't check, to avoid false negatives
        // or keep it false but allow override if widget is detected
        return { ...theme, supportsAppBlocks: true };
      }
    })
  );

  const backendUrl = process.env.BACKEND_URL || "https://subcollection.allgovjobs.com/backend";
  const apiKey = process.env.SHOPIFY_API_KEY;
  return json({ backendUrl, themes, apiKey });
};

/* ===========================
   ONBOARDING PAGE
=========================== */
export default function OnboardingPage() {
  const [widgetEnabled, setWidgetEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const SHOP = searchParams.get("shop");
  const navigate = useNavigate();
  const { backendUrl, themes, apiKey } = useLoaderData();

  const [selectedTheme, setSelectedTheme] = useState(() => {
    const mainTheme = themes.find((t) => t.role === "MAIN");
    return mainTheme ? String(mainTheme.id) : (themes[0] ? String(themes[0].id) : "current");
  });

  const themeOptions = themes.map((theme) => ({
    label: theme.name + (theme.role === "MAIN" ? " (Live)" : ""),
    value: String(theme.id),
  }));

  const isCompatible = themes.find((t) => String(t.id) === selectedTheme)?.supportsAppBlocks;

  const checkWidget = useCallback(() => {
    if (!SHOP || !selectedTheme) return;
    fetch(`${backendUrl}/api/check-widget?shop=${SHOP}&theme_id=${selectedTheme}`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data,'data');
        // Update enabled state based on the specific theme being checked
        setWidgetEnabled(!!data.installed);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [SHOP, backendUrl, selectedTheme]);

  // Initial check + poll every 5 seconds until widget is detected
  useEffect(() => {
    setWidgetEnabled(false); // Reset when theme changes
    setLoading(true);
    checkWidget();
    const interval = setInterval(() => {
      checkWidget();
    }, 5000);
    return () => clearInterval(interval);
  }, [checkWidget, selectedTheme]);

  // Stop polling once widget is enabled
  useEffect(() => {
    if (widgetEnabled) return;
  }, [widgetEnabled]);


  /* ===========================
     THEME EDITOR LINKS
  =========================== */
  const openCollectionEditor = () => {
    // Deep link to automatically add the app block
    const url =
      `https://${SHOP}/admin/themes/${selectedTheme}/editor` +
      `?template=collection` +
      `&addAppBlockId=${apiKey}/sub-collection-support` +
      `&target=newAppsSection`;

    window.open(url, "_blank");
  };

  /* ===========================
     STEP HANDLERS
  =========================== */
  const finishOnboarding = () => {
    navigate("/app/admin?shop=" + SHOP);
  };

  return (
    <Page fullWidth fullHeight>
      <WidgetInstallStep
        enabled={widgetEnabled}
        loading={loading}
        onOpenEditor={openCollectionEditor}
        onFinish={finishOnboarding}
        themeOptions={themeOptions}
        selectedTheme={selectedTheme}
        onThemeChange={setSelectedTheme}
        isCompatible={isCompatible}
      />
    </Page>
  );
}

/* ===========================
   STEP 2 – WIDGET INSTALL
=========================== */
function WidgetInstallStep({ enabled, loading, onOpenEditor, onFinish, themeOptions, selectedTheme, onThemeChange, isCompatible }) {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const toggleModal = useCallback(() => setIsVideoModalOpen((active) => !active), []);

  return (
    <Card padding="600">
      <InlineGrid columns={{ xs: "1fr", md: "1fr 1fr" }} gap="800" alignItems="center" style={{ minHeight: 360 }} >
        {/* ================= LEFT SIDE (VIDEO) ================= */}
        <BlockStack gap="400">
          <div
            style={{
              position: "relative",
              paddingBottom: "56.25%",
              height: 0,
              overflow: "hidden",
              borderRadius: 12,
              background: "#000",
            }}
          >
            <video
              src="https://agiledigitaledge.dev/smartnestvideos/video.mp4"
              title="Smart Nest Installation"
              autoPlay
              loop
              muted
              playsInline
              controls
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                border: 0,
              }}
            />
          </div>
          <InlineStack align="center">
            <Button onClick={toggleModal} variant="plain">
              Watch enlarged video
            </Button>
          </InlineStack>

          <Modal
            size="large"
            open={isVideoModalOpen}
            onClose={toggleModal}
            title="Smart Nest Installation Guide"
          >
            <Modal.Section>
              <video
                src="https://agiledigitaledge.dev/smartnestvideos/video.mp4"
                title="Smart Nest Installation"
                autoPlay
                controls
                style={{ width: "100%", borderRadius: 8, display: "block" }}
              />
            </Modal.Section>
          </Modal>
        </BlockStack>

        {/* ================= RIGHT SIDE (CONTENT) ================= */}
        <BlockStack gap="400" style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 10
        }}>
          {/* TOP CONTENT */}
          <BlockStack gap="400">
            <Text variant="headingLg">Install Smart Nest Widget</Text>

            <Text tone="subdued">
              Follow the steps below to add the Smart Nest widget to your
              collection page. This lets your customers browse child
              (sub) collections directly on any collection page.
            </Text>

            <div style={{ maxWidth: "300px" }}>
              <Select
                label="Select theme"
                options={themeOptions}
                value={selectedTheme}
                onChange={onThemeChange}
              />
            </div>

            {!isCompatible && !enabled && (
              <Banner tone="critical" title="Vintage Theme Detected">
                <p>
                  This is a vintage theme that does not support app blocks. 
                  Unfortunately, we cannot add Smart Nest to this theme. 
                  Please select an Online Store 2.0 compatible theme to proceed.
                </p>
              </Banner>
            )}

            <BlockStack gap="300">
              <Text>
                <strong>Step 1:</strong> Click the{" "}
                <strong>"Open Collection Editor"</strong> button below. This
                will open the Shopify Theme Editor and automatically prompt you to add the
                <strong>"Sub Collection Support"</strong> block.
              </Text>
              <Text>
                <strong>Step 2:</strong> In the Theme Editor, drag the Sub Collection Support block to your
                preferred position on the collection page (we recommend placing
                it just below the collection title/banner).
              </Text>
              <Text>
                <strong>Step 3 (Configuration):</strong> Click on the added <strong>"Sub Collection Support"</strong> 
                block in the sidebar. In the settings panel, ensure the <strong>"Enable Sub Collection Block"</strong> 
                checkbox is checked.
              </Text>
              <Text>
                <strong>Step 4:</strong> Click the <strong>"Save"</strong>{" "}
                button in the top‑right corner of the Theme Editor.
              </Text>
              <Text>
                <strong>Step 5:</strong> Return to this page — it will
                automatically detect the widget and show{" "}
                <strong>"Widget Installed"</strong>. If it doesn't appear
                within a few seconds, refresh the page. Then click{" "}
                <strong>"Finish"</strong> to complete the setup.
              </Text>
            </BlockStack>

            {loading ? (
              <InlineStack align="start" gap="300" style={{ marginTop: "auto" }}>
                <Spinner size="small" />
                <Text tone="subdued">Checking widget status…</Text>
              </InlineStack>
            ) : enabled ? (
              <InlineStack align="start" style={{ marginTop: "auto" }}>
                <Banner status="success">Widget Installed</Banner>
              </InlineStack>
            ) : isCompatible || enabled ? (
              <InlineStack align="start" style={{ marginTop: "auto" }}>
                <Button primary onClick={onOpenEditor}>
                  Open Collection Editor
                </Button>
              </InlineStack>
            ) : (
              <InlineStack align="start" style={{ marginTop: "auto" }}>
                <Button disabled>
                  Incompatible Theme
                </Button>
              </InlineStack>
            )}
          </BlockStack>

          {/* 👇 BOTTOM FIXED BUTTON */}
          <div style={{ marginTop: "auto" }}>
            <Button primary disabled={!enabled} onClick={onFinish}>
              Finish
            </Button>
          </div>
        </BlockStack>
      </InlineGrid>
    </Card>
  );
}