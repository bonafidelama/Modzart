"use client";

import { useEffect, useState } from "react";
import { modsService } from "@/services/modsService";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import Input from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search, Filter, ArrowDownToLine, Clock, Star, Sparkle } from "lucide-react";
import { toast } from "react-hot-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DiscoverPage() {
  const [mods, setMods] = useState([]);
  const [search, setSearch] = useState("");
  const [downloading, setDownloading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("grid");
  const [sortBy, setSortBy] = useState("recent");
  const [filterCategory, setFilterCategory] = useState("all");
  const [appliedFilters, setAppliedFilters] = useState({
    category: "all",
    sort: "recent"
  });

  useEffect(() => {
    fetchMods();
  }, [appliedFilters]);

  const fetchMods = async () => {
    try {
      setLoading(true);
      let params = search ? `search=${search}` : '';
      
      // Add filters to params
      if (appliedFilters.category !== "all") {
        params += params ? `&category=${appliedFilters.category}` : `category=${appliedFilters.category}`;
      }

      // Add sort to params
      if (appliedFilters.sort) {
        params += params ? `&sort=${appliedFilters.sort}` : `sort=${appliedFilters.sort}`;
      }

      const response = await modsService.list(params);
      setMods(response.data);
    } catch (error) {
      console.error("Failed to fetch mods", error);
      toast.error("Failed to load mods. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMods();
  };

  const handleDownload = async (modId) => {
    try {
      setDownloading(modId);
      const response = await modsService.download(modId);
      
      // Create a temporary link to trigger the download
      const link = document.createElement('a');
      link.href = response.download_url;
      link.setAttribute('download', ''); // This will keep the original filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started!");
    } catch (error) {
      console.error("Failed to download mod:", error);
      toast.error("Failed to download mod. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  const applyFilters = () => {
    setAppliedFilters({
      category: filterCategory,
      sort: sortBy
    });
  };

  // Function to format date in a readable way
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Categories for filtering
  const categories = [
    { value: "all", label: "All Categories" },
    { value: "gameplay", label: "Gameplay" },
    { value: "visual", label: "Visual" },
    { value: "audio", label: "Audio" },
    { value: "utility", label: "Utility" },
    { value: "project", label: "Projects" }
  ];

  // Sorting options
  const sortOptions = [
    { value: "recent", label: "Most Recent", icon: Clock },
    { value: "popular", label: "Most Popular", icon: Star },
    { value: "featured", label: "Featured", icon: Sparkle }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-r from-zinc-950 to-zinc-900 text-white p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Modzart Logo/Text Navigation */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
              Modzart
            </h1>
          </Link>
        </div>

        <motion.div 
          className="mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl font-bold mb-2 text-white">Discover Mods</h1>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Explore and download mods created by the community to enhance your experience
          </p>
        </motion.div>
        
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="w-full md:w-3/4">
            <form onSubmit={handleSearch} className="relative">
              <Input
                placeholder="Search mods by name, description or creator..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 pr-10"
              />
              <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white">
                <Search size={18} />
              </button>
            </form>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                  {categories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                  {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon size={16} />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={applyFilters} 
              className="bg-green-500 hover:bg-green-600 text-black font-medium"
            >
              <Filter size={16} className="mr-2" />
              Filter
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="grid" className="mb-6" onValueChange={setView}>
          <div className="flex justify-between items-center">
            <div className="text-sm text-zinc-400">
              {loading ? (
                "Loading mods..."
              ) : (
                `Found ${mods.length} mod${mods.length !== 1 ? 's' : ''}`
              )}
            </div>
            <TabsList className="bg-zinc-800">
              <TabsTrigger value="grid" className="data-[state=active]:bg-zinc-700">Grid</TabsTrigger>
              <TabsTrigger value="list" className="data-[state=active]:bg-zinc-700">List</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="grid">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-zinc-800 rounded-lg h-64"></div>
                ))}
              </div>
            ) : mods.length === 0 ? (
              <div className="text-center py-20 bg-zinc-800 rounded-lg">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-xl font-semibold text-white mb-2">No mods found</h3>
                  <p className="text-zinc-400">Try adjusting your search or filters</p>
                </motion.div>
              </div>
            ) : (
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                variants={container}
                initial="hidden"
                animate="show"
              >
                {mods.map((mod) => {
                  const isProject = mod.filename && mod.filename.startsWith('project:');
                  
                  return (
                    <motion.div key={mod.id} variants={item}>
                      <Card className="bg-zinc-800 border-zinc-700 shadow-lg hover:shadow-xl hover:bg-zinc-750 transition-all duration-300 cursor-pointer relative overflow-hidden h-full">
                        <CardContent className="p-4 flex flex-col h-full">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-white line-clamp-1">{mod.title}</h3>
                            {isProject && (
                              <span className="bg-zinc-700 text-green-400 text-xs font-medium px-2 py-0.5 rounded">Project</span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-400 mb-4 flex-grow line-clamp-2">{mod.description}</p>
                          
                          <div className="mt-auto">
                            <div className="flex items-center mb-3 text-xs text-zinc-500">
                              <Clock size={14} className="mr-1" />
                              <span>{formatDate(mod.created_at)}</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarFallback className="bg-zinc-700 text-green-400 text-xs">
                                    {mod.user?.username?.substring(0, 2).toUpperCase() || 'UN'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-zinc-400 truncate max-w-[100px]">
                                  {mod.user?.username || 'Unknown user'}
                                </span>
                              </div>
                              
                              <Button
                                onClick={() => handleDownload(mod.id)} 
                                disabled={downloading === mod.id}
                                variant="outline"
                                className="h-8 px-2 py-1 border-zinc-700 hover:bg-zinc-700"
                              >
                                {downloading === mod.id ? (
                                  "Loading..."
                                ) : (
                                  <>
                                    <ArrowDownToLine size={16} className="text-green-400 mr-1" />
                                    <span>Download</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </TabsContent>
          
          <TabsContent value="list">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-zinc-800 h-20 rounded-lg"></div>
                ))}
              </div>
            ) : mods.length === 0 ? (
              <div className="text-center py-20 bg-zinc-800 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-2">No mods found</h3>
                <p className="text-zinc-400">Try adjusting your search or filters</p>
              </div>
            ) : (
              <motion.div 
                className="space-y-4"
                variants={container}
                initial="hidden"
                animate="show"
              >
                {mods.map((mod) => {
                  const isProject = mod.filename && mod.filename.startsWith('project:');
                  
                  return (
                    <motion.div key={mod.id} variants={item}>
                      <Card className="bg-zinc-800 border-zinc-700 hover:bg-zinc-750 transition-all duration-300 cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-grow">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-white">{mod.title}</h3>
                                {isProject && (
                                  <span className="bg-zinc-700 text-green-400 text-xs font-medium px-2 py-0.5 rounded">Project</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-400 mt-1">{mod.description}</p>
                              
                              <div className="flex items-center mt-2 text-xs text-zinc-500">
                                <div className="flex items-center mr-4">
                                  <Avatar className="h-5 w-5 mr-1">
                                    <AvatarFallback className="bg-zinc-700 text-green-400 text-xs">
                                      {mod.user?.username?.substring(0, 2).toUpperCase() || 'UN'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{mod.user?.username || 'Unknown user'}</span>
                                </div>
                                
                                <div className="flex items-center">
                                  <Clock size={14} className="mr-1" />
                                  <span>{formatDate(mod.created_at)}</span>
                                </div>
                              </div>
                            </div>
                            
                            <Button
                              onClick={() => handleDownload(mod.id)}
                              disabled={downloading === mod.id}
                              variant="outline"
                              className="border-zinc-700 hover:bg-zinc-700"
                            >
                              {downloading === mod.id ? (
                                "Loading..."
                              ) : (
                                <>
                                  <ArrowDownToLine size={16} className="text-green-400 mr-1" />
                                  <span>Download</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}