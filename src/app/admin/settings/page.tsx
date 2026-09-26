import { webhookUrl, getSetting, SETTING_KEYS } from "@/lib/settings";
import { PAYLOAD_FIELDS } from "@/lib/webhook-payload";
import { Card, Table } from "@/components/admin/ui";
import { SettingsForms } from "./SettingsForms";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [saved, resolved] = await Promise.all([getSetting(SETTING_KEYS.webhookUrl), webhookUrl()]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-4xl text-red">Settings</h1>

      <Card title="GoHighLevel webhook">
        <p className="mb-4 text-sm text-ink">
          The URL saved here wins; the <code>GHL_WEBHOOK_URL</code> variable on the service is the fallback. Currently{" "}
          <strong>{resolved.url ? `in use from the ${resolved.source}` : "not configured — nobody receives a results email"}</strong>.
        </p>
        <SettingsForms savedUrl={saved} canTest={!!resolved.url} />
      </Card>

      <Card title="Payload fields">
        <p className="mb-3 text-sm text-ink">
          Create a custom field in GoHighLevel for each <code>taboo_*</code> name. Use Multi-line text for the
          <code> _start_here</code>, <code>_statement</code> and <code>_line</code> fields. See{" "}
          <code>docs/GHL_SETUP.md</code> in the repo for the full walkthrough.
        </p>
        <Table head={["Field"]} rows={PAYLOAD_FIELDS.map((f) => [<code key={f}>{f}</code>])} />
      </Card>
    </div>
  );
}
