
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ModPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <img src="/big-mod-banner.jpg" alt="Mod Banner" className="rounded-xl w-full h-64 object-cover" />

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Realistic Graphics Overhaul</h1>
        <p className="text-muted-foreground">by Alice Creator • 1.2M Downloads</p>
      </div>

      <div className="space-y-4">
        <p>
          This mod enhances all textures, lighting, and weather effects for a
          more immersive experience.
        </p>
        <Button>Download</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold mb-2">Version History</h2>
          <ul className="text-sm space-y-1">
            <li>v2.0 - Major update (Apr 2025)</li>
            <li>v1.5 - Added weather tweaks</li>
            <li>v1.0 - Initial release</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
