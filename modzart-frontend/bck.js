"use client";

import { useEffect, useState } from "react";
import axios from "axios";
//import { Input } from "@/components/ui/input";
import Input from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { motion } from "framer-motion";




export default function HomePage() {
  const [mods, setMods] = useState([]);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    axios.get("https://your-backend.com/api/mods")
      .then(response => setMods(response.data))
      .catch(error => console.error("Error fetching mods:", error));
  }, []);

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-r from-zinc-950 to-zinc-900 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Navigation Bar */}
      <div className="flex justify-between items-center p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <img src="/modzart-logo.svg" alt="Modzart Logo" className="w-8 h-8" />
          <span className="text-2xl font-bold">Modzart</span>
        </div>
        <div className="flex gap-6 text-sm">
          <a href="#" className="hover:text-green-400">Discover content</a>
          <a href="#" className="hover:text-green-400">Host a server</a>
          <a href="#" className="hover:text-green-400">Get Modzart App</a>
        </div>
        <Button className="bg-green-500 hover:bg-green-600 text-black font-bold">Sign in</Button>
      </div>

      {/* Hero Section */}
      <div className="text-center py-20 bg-[url('/maze-bg.svg')] bg-cover bg-center">
        <motion.h1 
          className="text-5xl font-bold"
          initial={{ y: -10, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 0.5 }}
        >
          The place for GTA V <span className="text-green-400">mods</span>
        </motion.h1>
        <motion.p 
          className="text-gray-300 mt-4 text-lg"
          initial={{ y: 10, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Discover, play, and share GTA V content through our open-source platform built for the community.
        </motion.p>
        <div className="mt-8 flex justify-center gap-4">
          <Button className="bg-green-500 hover:bg-green-600 text-black font-bold">Discover mods</Button>
          <Button variant="outline" className="border-white text-white hover:bg-zinc-800">Sign up</Button>
        </div>
      </div>

            {/* Search Station */}
            
            <div className="flex justify-center mt-12 mb-6">
        <motion.div 
          className="relative w-1/2" 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          transition={{ duration: 0.5 }}
        >
          <Search className="absolute left-3 top-3 text-gray-400" />
          <Input
            type="text"
            placeholder="Search GTA V mods..."
            className="pl-10 bg-zinc-800 border-none text-white"
            value={search}
            onFocus={() => setSearchOpen(true)}
            onChange={(e) => setSearch(e.target.value)}
          />
        </motion.div>
      </div>

      {/* Expanded Search Station Section */}
      {searchOpen && (
        <motion.div 
          className="bg-zinc-900 p-6 mx-4 rounded-xl shadow-md border border-zinc-700"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-green-400">Search Results</h2>
            <button 
              onClick={() => setSearchOpen(false)} 
              className="text-sm text-gray-400 hover:text-white"
            >
              Close
            </button>
          </div>

          {/* Mods List */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.2 } }
            }}
          >
            {mods
              .filter(mod => mod.name.toLowerCase().includes(search.toLowerCase()))
              .map(mod => (
                <motion.div key={mod.id} variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}>
                  <Card className="p-4 shadow-lg hover:shadow-2xl transition-shadow duration-300 bg-zinc-800 text-white">
                    <motion.img
                      src={mod.image}
                      alt={mod.name}
                      className="w-full h-40 object-cover rounded-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    />
                    <CardContent>
                      <h3 className="text-lg font-semibold mt-2">{mod.name}</h3>
                      <p className="text-sm text-gray-400">{mod.description}</p>
                      <Button className="mt-3 w-full bg-green-500 text-black hover:bg-green-600">Download</Button>
                    </CardContent>
                  </Card>
                </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}


      {/* Mods List */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4 pb-10"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: 10 },
          visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.2 } }
        }}
      >
        {mods
          .filter(mod => mod.name.toLowerCase().includes(search.toLowerCase()))
          .map(mod => (
            <motion.div key={mod.id} variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}>
              <Card className="p-4 shadow-lg hover:shadow-2xl transition-shadow duration-300 bg-zinc-800 text-white">
                <motion.img
                  src={mod.image}
                  alt={mod.name}
                  className="w-full h-40 object-cover rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                />
                <CardContent>
                  <h3 className="text-lg font-semibold mt-2">{mod.name}</h3>
                  <p className="text-sm text-gray-400">{mod.description}</p>
                  <Button className="mt-3 w-full bg-green-500 text-black hover:bg-green-600">Download</Button>
                </CardContent>
              </Card>
            </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}






"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import  Input  from "@/components/ui/input";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HomePage() {
  const [mods, setMods] = useState([]);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    axios.get("https://your-backend.com/api/mods")
      .then(response => setMods(response.data))
      .catch(error => console.error("Error fetching mods:", error));
  }, []);

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-white px-4 py-8 sm:px-6 lg:px-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero Section */}
      <div className="text-center mb-12">
        <motion.h1 
          className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-3"
          initial={{ y: -20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 0.6 }}
        >
          Modzart 🎮
        </motion.h1>
        <motion.p 
          className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto"
          initial={{ y: 10, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Discover epic mods crafted for GTA V. Beautifully organized, blazing fast.
        </motion.p>
      </div>

      {/* Search Bar */}
      <div className="flex justify-center mb-14">
        <motion.div 
          className="relative w-full max-w-xl"
          initial={{ scale: 0.95, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          transition={{ duration: 0.4 }}
        >
          <Search className="absolute left-4 top-3.5 text-gray-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search for GTA V mods..."
            className="pl-12 pr-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setSearchOpen(false)}
          />
        </motion.div>
      </div>

      {/* Mods Grid */}
      <AnimatePresence>
        <motion.div 
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.15 } }
          }}
        >
          {mods
            .filter(mod => mod.name.toLowerCase().includes(search.toLowerCase()))
            .map(mod => (
              <motion.div 
                key={mod.id} 
                className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
                variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
              >
                <img 
                  src={mod.image} 
                  alt={mod.name} 
                  className="w-full h-48 object-cover"
                />
                <CardContent className="p-5">
                  <h3 className="text-xl font-bold text-white mb-1">{mod.name}</h3>
                  <p className="text-sm text-gray-400 mb-4">{mod.description}</p>
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 transition-colors">
                    Download
                  </Button>
                </CardContent>
              </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

