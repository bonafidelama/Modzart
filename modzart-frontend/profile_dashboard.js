
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfileDashboard() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src="/profile.jpg" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold">John Doe</h1>
            <p className="text-muted-foreground">Mod Creator • 24 Mods</p>
          </div>
        </div>
        <Button>Edit Profile</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <img src="/mod-thumbnail.jpg" alt="Mod Thumbnail" className="rounded-lg mb-2" />
              <h3 className="font-medium">Awesome Mod #{i + 1}</h3>
              <p className="text-sm text-muted-foreground">Updated 2 days ago</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
