
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function CreatorProfile() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src="/creator.jpg" />
          <AvatarFallback>AC</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">Alice Creator</h1>
          <p className="text-muted-foreground">Total Mods: 12</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <img src="/mod-thumb.jpg" alt="Mod Thumbnail" className="rounded-lg mb-2" />
              <h3 className="font-medium">Cool Mod #{i + 1}</h3>
              <p className="text-sm text-muted-foreground">Downloads: {500 + i * 13}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
