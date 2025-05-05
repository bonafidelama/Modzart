"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { modsService } from "@/services/modsService";
import { authService } from "@/services/authService";
import { toast } from "react-hot-toast";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Ensure we're in a browser environment
const isBrowser = typeof window !== 'undefined';

export default function ProfileDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [mods, setMods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
  });
  const [projectData, setProjectData] = useState({
    name: "",
    url: "",
    visibility: "public",
    summary: "",
  });

  useEffect(() => {
    let mounted = true;

    if (user && isBrowser && mounted) {
      setProfileData({
        username: user.username,
        email: user.email,
      });
      fetchUserMods();
    }

    return () => { mounted = false; };
  }, [user]);

  const fetchUserMods = async () => {
    if (!user || !user.id) {
      console.log("User not yet loaded, skipping fetch");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await modsService.list(`user_id=${user.id}`, { signal: controller.signal });
      clearTimeout(timeoutId);

      setMods(response.data);
      console.log("Fetched user content:", response.data);
    } catch (error) {
      console.error("Failed to fetch user content:", error);

      if (error.name === 'AbortError') {
        toast.error("Request timed out. Please check if the backend server is running.");
      } else if (error.message && error.message.includes('Network Error')) {
        toast.error("Cannot connect to the backend server. Is it running?");
        setMods([]);
      } else {
        toast.error("Could not load your content. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      const response = await authService.updateProfile(profileData);
      setIsEditing(false);
      if (response.data) {
        user.username = response.data.username;
        user.email = response.data.email;
      }
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error(error.response?.data?.detail || "Failed to update profile");
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-zinc-950 to-zinc-900 text-white">
        <p className="text-lg text-gray-400">Please log in to view your profile</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-r from-zinc-950 to-zinc-900 text-white pt-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Modzart text link at the top right */}
      <div className="absolute top-4 right-6 z-10">
        <Link href="/" className="flex items-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent hover:scale-105 transition-transform">
            Modzart
          </h1>
        </Link>
      </div>

      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback className="bg-zinc-800 text-green-400">{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold text-white">{user.username}</h1>
              <p className="text-gray-400">Mod Creator • {mods.length} Mods</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="outline" className="h-10 w-10 p-0 border-zinc-700 bg-zinc-800 hover:bg-zinc-700">
                  <Plus className="h-4 w-4 text-green-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-zinc-800 border-zinc-700 text-white">
                <DropdownMenuItem onClick={() => setShowProjectDialog(true)} className="hover:bg-zinc-700 hover:text-green-400">
                  New project
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-700" />
                <DropdownMenuItem className="hover:bg-zinc-700 hover:text-green-400">
                  New collection
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-zinc-700 hover:text-green-400">
                  New organization
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {isEditing ? (
              <Button onClick={handleSaveProfile} className="bg-green-500 hover:bg-green-600 text-black font-bold">
                Save Changes
              </Button>
            ) : (
              <Button onClick={handleEditProfile} className="bg-green-500 hover:bg-green-600 text-black font-bold">
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
          <DialogContent className="bg-zinc-900 text-white border-zinc-700">
            <DialogHeader>
              <DialogTitle className="text-white">Creating a project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Name *</label>
                <Input
                  placeholder="Enter project name..."
                  value={projectData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    // Generate URL slug from project name
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                    setProjectData({ 
                      ...projectData,
                      name: name,
                      url: name ? `https://modzart.com/${slug}` : ''
                    });
                  }}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">URL *</label>
                <Input
                  placeholder="https://modzart.com/project/"
                  value={projectData.url}
                  onChange={(e) => setProjectData({ ...projectData, url: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Visibility *</label>
                <Select 
                  value={projectData.visibility}
                  onValueChange={(value) => setProjectData({ ...projectData, visibility: value })}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="unlisted">Unlisted</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-gray-400">
                  The visibility of your project after it has been approved.
                </span>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Summary *</label>
                <Input
                  placeholder="A sentence or two that describes your project."
                  value={projectData.summary}
                  onChange={(e) => setProjectData({ ...projectData, summary: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowProjectDialog(false)}
                className="border-zinc-700 text-white hover:bg-zinc-700">
                Cancel
              </Button>
              <Button onClick={async () => {
                try {
                  // Validate required fields
                  if (!projectData.name || !projectData.url || !projectData.summary) {
                    toast.error("Please fill in all required fields");
                    return;
                  }

                  // Call the createProject endpoint
                  const response = await modsService.createProject(projectData);
                  
                  // Close the dialog and show success message
                  setShowProjectDialog(false);
                  toast.success("Project created successfully!");
                  
                  // Refresh the mods list to show the new project
                  fetchUserMods();
                  
                  // Reset the form
                  setProjectData({
                    name: "",
                    url: "",
                    visibility: "public",
                    summary: "",
                  });
                } catch (error) {
                  console.error("Failed to create project:", error);
                  toast.error(error.response?.data?.detail || "Failed to create project");
                }
              }}
              className="bg-green-500 hover:bg-green-600 text-black font-bold"
              >
                Create project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {isEditing && (
          <Card className="p-4 mb-6 bg-zinc-800 border-zinc-700 text-white">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white">Username</label>
                <Input
                  value={profileData.username}
                  onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                  className="mt-1 bg-zinc-700 border-zinc-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white">Email</label>
                <Input
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="mt-1 bg-zinc-700 border-zinc-600 text-white"
                />
              </div>
            </div>
          </Card>
        )}

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } }
          }}
        >
          {loading ? (
            <motion.p 
              className="col-span-full text-center text-gray-400"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            >
              Loading content...
            </motion.p>
          ) : mods.length === 0 ? (
            <motion.p 
              className="col-span-full text-center text-gray-400"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            >
              You haven't created any content yet
            </motion.p>
          ) : (
            mods.map((mod) => {
              // Check if this is a project by examining the filename
              const isProject = mod.filename && mod.filename.startsWith('project:');
              const projectUrl = isProject ? mod.filename.substring(8) : null;
              
              return (
                <motion.div key={mod.id} variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}>
                  <a 
                    href={isProject ? `/project-publish?id=${mod.id}` : `/mods/${mod.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('Card clicked!', { isProject, modId: mod.id });
                      try {
                        if (isProject) {
                          console.log('Navigating to project page:', `/project-publish?id=${mod.id}`);
                          window.location.href = `/project-publish?id=${mod.id}`;
                        } else {
                          console.log('Navigating to mod detail page:', `/mods/${mod.id}`);
                          window.location.href = `/mods/${mod.id}`;
                        }
                      } catch (error) {
                        console.error('Navigation error:', error);
                      }
                    }}
                    className="block text-white no-underline"
                  >
                    <Card className="bg-zinc-800 border-zinc-700 shadow-lg hover:shadow-xl hover:bg-zinc-750 transition-all duration-300 cursor-pointer relative overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-white">{mod.title}</h3>
                          {isProject && (
                            <span className="bg-zinc-700 text-green-400 text-xs font-medium px-2 py-0.5 rounded">Project</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{mod.description}</p>
                        {isProject && projectUrl && (
                          <p className="text-xs text-green-400 mt-2 truncate">
                            <span className="font-medium">URL:</span> {projectUrl}
                          </p>
                        )}
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-gray-500">
                            Created {new Date(mod.created_at).toLocaleDateString()}
                          </p>
                          {isProject && (
                            <span className={`text-xs ${
                              mod.project_visibility === 'public' ? 'text-green-400' : 
                              mod.project_visibility === 'private' ? 'text-red-500' : 
                              'text-yellow-500'}`}>
                              {mod.project_visibility}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}