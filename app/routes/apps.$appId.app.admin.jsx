import { redirect } from "@remix-run/node";

// This route catches the malformed URL that Shopify sometimes redirects to after billing
// Pattern: /apps/:appId/app/admin
export const loader = ({ request }) => {
    const url = new URL(request.url);
    // Redirect to the correct path, preserving the query parameters (e.g., charge_id)
    return redirect(`/app/admin${url.search}`);
};

export default function RedirectRoute() {
    return null;
}
