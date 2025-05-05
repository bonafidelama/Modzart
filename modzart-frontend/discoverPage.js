"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

export default function DiscoverPage() {
  const [mods, setMods] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    axios.get("https://your-backend.com/api/mods")
      .then((res) => setMods(res.data))
      .catch((err) => console.error("Failed to fetch mods", err));
  }, []);

  const filtered = mods.filter(mod =>
    mod.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-4xl font-bold mb-6 text-center">Discover Mods</h1>
      <div className="max-w-xl mx-auto mb-10">
        <Input
          placeholder="Search mods..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-800 text-white placeholder-gray-400"
        />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {filtered.map((mod) => (
          <Card key={mod.id} className="bg-gray-800 rounded-xl shadow-md">
            <img src={mod.image} alt={mod.name} className="w-full h-40 object-cover rounded-t-xl" />
            <CardContent className="p-4">
              <h3 className="text-xl font-semibold">{mod.name}</h3>
              <p className="text-gray-400 text-sm mb-3">{mod.description}</p>
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded-lg transition">
                Download
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
