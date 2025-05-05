"use client";

import { useEffect, useState } from "react";
import { modsService } from "@/services/modsService";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

export default function ModsDiscoveryPage() {
    const [mods, setMods] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMods();
    }, [search]);

    const fetchMods = async () => {
        try {
            setLoading(true);
            const response = await modsService.list(search);
            setMods(response.data);
        } catch (error) {
            console.error("Error fetching mods:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-r from-zinc-950 to-zinc-900 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">Discover Mods</h1>
                
                <div className="mb-8">
                    <Input
                        type="text"
                        placeholder="Search mods..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-zinc-800 border-none text-white w-full max-w-md"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        // Loading skeletons
                        Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="bg-zinc-800 animate-pulse">
                                <CardContent className="p-4">
                                    <div className="h-4 bg-zinc-700 rounded w-3/4 mb-4"></div>
                                    <div className="h-3 bg-zinc-700 rounded w-full mb-2"></div>
                                    <div className="h-3 bg-zinc-700 rounded w-2/3"></div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        mods.map((mod) => (
                            <motion.div
                                key={mod.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card className="bg-zinc-800 hover:bg-zinc-700 transition-colors">
                                    <CardContent className="p-4">
                                        <h2 className="text-xl font-semibold mb-2">{mod.title}</h2>
                                        <p className="text-zinc-400 text-sm mb-4">{mod.description}</p>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-zinc-500">Downloads: {mod.downloads}</span>
                                            <span className="text-zinc-500">Version: {mod.version}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}