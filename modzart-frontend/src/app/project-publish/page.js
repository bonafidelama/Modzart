"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { modsService } from "@/services/modsService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Input from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import Image from "next/image";
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
  Check, 
  ChevronRight, 
  ChevronDown, 
  FileUp, 
  FileText, 
  Image as ImageIcon, 
  Link, 
  FileCode, 
  Send, 
  Scale, 
  ChevronUp,
  X,
  Plus,
  Trash2,
  Upload,
  Globe,
  Github,
  ExternalLink
} from 'lucide-react';

export default function ProjectPublishPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('id');
  const { user } = useAuth();
  
  const fileInputRef = useRef(null);
  const iconInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  
  // State for dialogs
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [showIconDialog, setShowIconDialog] = useState(false);
  const [showGalleryDialog, setShowGalleryDialog] = useState(false);
  const [showLinksDialog, setShowLinksDialog] = useState(false);
  
  // State for versions
  const [versions, setVersions] = useState([]);
  const [versionData, setVersionData] = useState({
    version_number: '',
    changelog: '',
    file: null
  });
  
  // State for gallery
  const [galleryImages, setGalleryImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // State for links
  const [links, setLinks] = useState([]);
  const [newLink, setNewLink] = useState({ type: 'website', url: '' });
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    visibility: "public",
    summary: "",
    license: "",
    externalLinks: []
  });

  // Checklist state
  const [checklist, setChecklist] = useState({
    hasVersion: false,
    hasDescription: false,
    hasIcon: false,
    hasGallery: false,
    hasLinks: false,
    hasLicense: false,
    isReadyForReview: false
  });

  // Load all project data including versions, gallery, etc.
  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!projectId) return;

      try {
        setLoading(true);
        setError(null);
        
        // Get basic project data
        const response = await modsService.getById(projectId);
        const projectData = response.data;
        
        // Check if this is actually a project
        if (!projectData.filename?.startsWith('project:')) {
          setError("This is not a project");
          return;
        }
        
        setProject(projectData);
        setFormData({
          title: projectData.title || "",
          description: projectData.description || "",
          url: projectData.filename?.substring(8) || "",
          visibility: projectData.project_visibility || "public",
          summary: projectData.summary || "",
          license: projectData.license || "",
          externalLinks: projectData.external_links || []
        });
        
        // Set external links
        setLinks(projectData.external_links || []);

        // Fetch versions
        try {
          const versionsResponse = await modsService.getVersions(projectId);
          setVersions(versionsResponse.data || []);
        } catch (e) {
          console.error("Failed to fetch versions:", e);
          // Don't fail the whole page load for this
        }
        
        // Fetch gallery images
        try {
          const galleryResponse = await modsService.getGalleryImages(projectId);
          setGalleryImages(galleryResponse.data || []);
        } catch (e) {
          console.error("Failed to fetch gallery images:", e);
          // Don't fail the whole page load for this
        }

        // Set checklist states based on project data
        setChecklist({
          hasVersion: Boolean(versions.length) || Boolean(projectData.versions?.length),
          hasDescription: Boolean(projectData.description),
          hasIcon: Boolean(projectData.icon_url),
          hasGallery: Boolean(galleryImages.length) || Boolean(projectData.gallery_images?.length),
          hasLinks: Boolean(projectData.external_links?.length),
          hasLicense: Boolean(projectData.license),
          isReadyForReview: projectData.status === 'in_review' || projectData.status === 'published'
        });
      } catch (error) {
        console.error("Failed to fetch project details:", error);
        setError("Failed to load project details. Please try again later.");
        toast.error("Could not load project details");
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [projectId]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to update a project");
      return;
    }
    
    try {
      setSaving(true);
      const updatedData = {
        id: projectId,
        title: formData.title,
        description: formData.description,
        filename: `project:${formData.url}`,
        project_visibility: formData.visibility,
        summary: formData.summary,
        license: formData.license,
        external_links: links
      };
      
      await modsService.updateProject(updatedData);
      toast.success("Project updated successfully!");
      // Refresh project data
      const response = await modsService.getById(projectId);
      setProject(response.data);
      
      // Update checklist
      setChecklist({
        ...checklist,
        hasDescription: Boolean(formData.description),
        hasLicense: Boolean(formData.license),
        hasLinks: links.length > 0
      });
    } catch (error) {
      console.error("Failed to update project:", error);
      toast.error(error.response?.data?.detail || "Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const submitForReview = async () => {
    try {
      setSaving(true);
      await modsService.submitForReview(projectId);
      toast.success("Project submitted for review!");
      setChecklist({...checklist, isReadyForReview: true});
    } catch (error) {
      toast.error("Failed to submit project for review");
    } finally {
      setSaving(false);
    }
  };
  
  // Version handling
  const handleVersionSubmit = async (e) => {
    e.preventDefault();
    
    if (!versionData.version_number || !versionData.file) {
      toast.error("Please provide a version number and file");
      return;
    }
    
    try {
      setSaving(true);
      await modsService.uploadVersion(projectId, versionData);
      toast.success("Version uploaded successfully!");
      
      // Refresh versions
      const versionsResponse = await modsService.getVersions(projectId);
      setVersions(versionsResponse.data || []);
      
      // Update checklist
      setChecklist({...checklist, hasVersion: true});
      
      // Reset form and close dialog
      setVersionData({
        version_number: '',
        changelog: '',
        file: null
      });
      setShowVersionDialog(false);
    } catch (error) {
      console.error("Failed to upload version:", error);
      toast.error(error.response?.data?.detail || "Failed to upload version");
    } finally {
      setSaving(false);
    }
  };
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setVersionData({...versionData, file: e.target.files[0]});
    }
  };
  
  // Icon handling
  const handleIconSubmit = async (e) => {
    e.preventDefault();
    
    const iconFile = iconInputRef.current?.files?.[0];
    if (!iconFile) {
      toast.error("Please select an icon image");
      return;
    }
    
    try {
      setSaving(true);
      await modsService.uploadIcon(projectId, iconFile);
      toast.success("Icon uploaded successfully!");
      
      // Refresh project to get new icon URL
      const response = await modsService.getById(projectId);
      setProject(response.data);
      
      // Update checklist
      setChecklist({...checklist, hasIcon: true});
      
      // Close dialog
      setShowIconDialog(false);
    } catch (error) {
      console.error("Failed to upload icon:", error);
      toast.error(error.response?.data?.detail || "Failed to upload icon");
    } finally {
      setSaving(false);
    }
  };
  
  // Gallery handling
  const handleGalleryImageSubmit = async (e) => {
    e.preventDefault();
    
    const imageFile = galleryInputRef.current?.files?.[0];
    if (!imageFile) {
      toast.error("Please select an image for the gallery");
      return;
    }
    
    try {
      setSaving(true);
      await modsService.uploadGalleryImage(projectId, imageFile);
      toast.success("Gallery image uploaded successfully!");
      
      // Refresh gallery images
      const galleryResponse = await modsService.getGalleryImages(projectId);
      setGalleryImages(galleryResponse.data || []);
      
      // Update checklist
      setChecklist({...checklist, hasGallery: true});
      
      // Reset input and close dialog if needed
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to upload gallery image:", error);
      toast.error(error.response?.data?.detail || "Failed to upload gallery image");
    } finally {
      setSaving(false);
    }
  };
  
  const deleteGalleryImage = async (imageId) => {
    if (!confirm("Are you sure you want to delete this image?")) return;
    
    try {
      await modsService.deleteGalleryImage(projectId, imageId);
      toast.success("Gallery image deleted");
      
      // Update local state
      setGalleryImages(galleryImages.filter(img => img.id !== imageId));
      
      // Update checklist if no images left
      if (galleryImages.length <= 1) {
        setChecklist({...checklist, hasGallery: false});
      }
    } catch (error) {
      console.error("Failed to delete gallery image:", error);
      toast.error("Failed to delete gallery image");
    }
  };
  
  // External links handling
  const addLink = () => {
    if (!newLink.url) {
      toast.error("Please enter a URL");
      return;
    }
    
    // Validate URL
    try {
      new URL(newLink.url);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }
    
    // Add new link
    const updatedLinks = [...links, { ...newLink }];
    setLinks(updatedLinks);
    
    // Reset new link form
    setNewLink({ type: 'website', url: '' });
  };
  
  const removeLink = (index) => {
    const updatedLinks = [...links];
    updatedLinks.splice(index, 1);
    setLinks(updatedLinks);
  };
  
  const handleLinksSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      await modsService.updateExternalLinks(projectId, links);
      toast.success("External links updated successfully!");
      
      // Update formData with new links
      setFormData({...formData, externalLinks: links});
      
      // Update checklist
      setChecklist({...checklist, hasLinks: links.length > 0});
      
      // Close dialog
      setShowLinksDialog(false);
    } catch (error) {
      console.error("Failed to update external links:", error);
      toast.error("Failed to update external links");
    } finally {
      setSaving(false);
    }
  };
  
  // Link type icons mapping
  const getLinkIcon = (type) => {
    switch (type) {
      case 'website': return <Globe size={16} />;
      case 'github': return <Github size={16} />;
      case 'discord': return <FileCode size={16} />;
      default: return <ExternalLink size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-zinc-950 to-zinc-900 flex justify-center items-center">
        <p className="text-white">Loading project details...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-zinc-950 to-zinc-900 flex justify-center items-center flex-col gap-4">
        <p className="text-white text-xl">{error || "Project not found"}</p>
        <Button 
          onClick={() => router.push('/profile')}
          className="bg-green-500 hover:bg-green-600 text-black font-bold"
        >
          Back to Profile
        </Button>
      </div>
    );
  }

  // Check if user is the owner
  const isOwner = user && project && user.id === project.user_id;
  if (!isOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-zinc-950 to-zinc-900 flex justify-center items-center flex-col gap-4">
        <p className="text-white text-xl">You do not have permission to edit this project</p>
        <Button 
          onClick={() => router.push('/profile')}
          className="bg-green-500 hover:bg-green-600 text-black font-bold"
        >
          Back to Profile
        </Button>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-r from-zinc-950 to-zinc-900 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button 
            onClick={() => router.push('/profile')}
            className="bg-zinc-800 hover:bg-zinc-700 text-white"
          >
            ← Back to Profile
          </Button>
          <Button
            onClick={() => setExpanded(!expanded)}
            className="bg-zinc-800 hover:bg-zinc-700 text-white flex items-center gap-2"
          >
            {expanded ? 'Hide project details' : 'Show project details'}
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>

        {/* Project details form (collapsible) */}
        {expanded && (
          <Card className="bg-zinc-800 border-zinc-700 mb-6">
            <CardContent className="p-6">
              <h1 className="text-2xl font-bold text-white mb-6">Edit Project: {project.title}</h1>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Project Name *</label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Your project name"
                    required
                    className="bg-zinc-700 border-zinc-600 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">URL *</label>
                  <Input
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    placeholder="https://modzart.com/your-project"
                    required
                    className="bg-zinc-700 border-zinc-600 text-white"
                  />
                  <p className="text-xs text-gray-400">
                    This is the public URL where your project will be accessible.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Summary *</label>
                  <Input
                    name="summary"
                    value={formData.summary}
                    onChange={handleInputChange}
                    placeholder="A short summary of your project"
                    required
                    className="bg-zinc-700 border-zinc-600 text-white"
                  />
                  <p className="text-xs text-gray-400">
                    A brief one-line description of your project.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Visibility *</label>
                  <Select 
                    value={formData.visibility}
                    onValueChange={(value) => setFormData(prev => ({...prev, visibility: value}))}
                  >
                    <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white">
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="unlisted">Unlisted</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400">
                    Controls who can see your project.
                  </p>
                </div>
                
                <div className="pt-4 border-t border-zinc-700">
                  <Button 
                    type="submit" 
                    className="bg-green-500 hover:bg-green-600 text-black font-bold w-full"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Project Details"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        
        {/* Publishing Checklist */}
        <Card className="bg-zinc-800 border-zinc-700 mb-6 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-white">Publishing checklist</h1>
              <div className="flex items-center gap-2">
                <span className="text-white text-sm mr-2">Progress:</span>
                <div className="flex gap-1">
                  {Object.keys(checklist).map((key, i) => (
                    <div 
                      key={i} 
                      className={`w-6 h-6 rounded-full flex items-center justify-center 
                        ${checklist[key] ? 
                          (key === 'isReadyForReview' ? 'bg-yellow-600' : 'bg-green-600') : 
                          ((i + 1) % 2 === 0 ? 'bg-purple-900' : 'bg-red-900')}`}
                    >
                      {checklist[key] ? <Check size={16} className="text-black" /> : ""}
                    </div>
                  ))}
                  <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center">
                    <Check size={16} className="text-green-400" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Column */}
              <div className="space-y-4">
                {/* Upload version */}
                <div className={`bg-zinc-900 rounded-md p-4 border ${checklist.hasVersion ? 'border-green-500' : 'border-red-500'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 text-2xl ${checklist.hasVersion ? 'text-green-500' : 'text-red-500'}`}>
                      {checklist.hasVersion ? <Check size={20} /> : '*'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <FileUp size={16} />
                        Upload a version
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        At least one version is required for a project to be submitted for review.
                      </p>
                      <Button 
                        className="mt-3 bg-zinc-800 hover:bg-zinc-700 text-blue-400 flex items-center gap-2"
                        onClick={() => setShowVersionDialog(true)}
                      >
                        {versions.length > 0 ? 'Manage versions' : 'Upload version'} <ChevronRight size={16} />
                      </Button>
                      
                      {versions.length > 0 && (
                        <div className="mt-3 bg-zinc-800 rounded p-2">
                          <p className="text-xs text-gray-300 mb-1">Current versions:</p>
                          {versions.map((version, index) => (
                            <div key={index} className="text-xs text-gray-400 py-1 border-b border-zinc-700 last:border-0">
                              {version.version_number}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Add description */}
                <div className={`bg-zinc-900 rounded-md p-4 border ${checklist.hasDescription ? 'border-green-500' : 'border-red-500'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 text-2xl ${checklist.hasDescription ? 'text-green-500' : 'text-red-500'}`}>
                      {checklist.hasDescription ? <Check size={20} /> : '*'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <FileText size={16} />
                        Add a description
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        A description that clearly describes the project's purpose and function is required.
                      </p>
                      <div className="mt-3 space-y-3">
                        <Textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Detailed description of your project"
                          rows={3}
                          className="bg-zinc-800 border-zinc-700 text-white"
                        />
                        <Button 
                          className="w-full bg-zinc-800 hover:bg-zinc-700 text-blue-400 flex items-center justify-center gap-2"
                          onClick={handleSubmit}
                          disabled={saving}
                        >
                          {saving ? "Saving..." : "Save description"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Add external links */}
                <div className={`bg-zinc-900 rounded-md p-4 border ${checklist.hasLinks ? 'border-green-500' : 'border-purple-600 border-opacity-50'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 text-2xl ${checklist.hasLinks ? 'text-green-500' : 'text-purple-500'}`}>
                      {checklist.hasLinks ? <Check size={20} /> : '?'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <Link size={16} />
                        Add external links
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Add any relevant links targeted outside of Modrinith, such as sources, issues, or a Discord invite.
                      </p>
                      <Button 
                        className="mt-3 bg-zinc-800 hover:bg-zinc-700 text-blue-400 flex items-center gap-2"
                        onClick={() => setShowLinksDialog(true)}
                      >
                        {links.length > 0 ? 'Manage links' : 'Add external links'} <ChevronRight size={16} />
                      </Button>
                      
                      {links.length > 0 && (
                        <div className="mt-3 bg-zinc-800 rounded p-2">
                          <p className="text-xs text-gray-300 mb-1">Current links:</p>
                          {links.map((link, index) => (
                            <div key={index} className="text-xs flex items-center gap-1 text-gray-400 py-1 border-b border-zinc-700 last:border-0">
                              {getLinkIcon(link.type)}
                              <span className="truncate">{link.url}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Second Column */}
              <div className="space-y-4">
                {/* Add an icon */}
                <div className={`bg-zinc-900 rounded-md p-4 border ${checklist.hasIcon ? 'border-green-500' : 'border-purple-600 border-opacity-50'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 text-2xl ${checklist.hasIcon ? 'text-green-500' : 'text-purple-500'}`}>
                      {checklist.hasIcon ? <Check size={20} /> : '?'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <ImageIcon size={16} />
                        Add an icon
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Your project should have a nice-looking icon to uniquely identify your project at a glance.
                      </p>
                      <Button 
                        className="mt-3 bg-zinc-800 hover:bg-zinc-700 text-blue-400 flex items-center gap-2"
                        onClick={() => setShowIconDialog(true)}
                      >
                        {project.icon_url ? 'Change icon' : 'Upload icon'} <ChevronRight size={16} />
                      </Button>
                      
                      {project.icon_url && (
                        <div className="mt-3 flex justify-center">
                          <div className="w-16 h-16 overflow-hidden rounded-lg bg-zinc-800">
                            {project.icon_url && (
                              <img 
                                src={project.icon_url} 
                                alt="Project Icon" 
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Feature a gallery image */}
                <div className={`bg-zinc-900 rounded-md p-4 border ${checklist.hasGallery ? 'border-green-500' : 'border-purple-600 border-opacity-50'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 text-2xl ${checklist.hasGallery ? 'text-green-500' : 'text-purple-500'}`}>
                      {checklist.hasGallery ? <Check size={20} /> : '?'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <ImageIcon size={16} />
                        Feature a gallery image
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Featured gallery images may be the first impression of many users.
                      </p>
                      <Button 
                        className="mt-3 bg-zinc-800 hover:bg-zinc-700 text-blue-400 flex items-center gap-2"
                        onClick={() => setShowGalleryDialog(true)}
                      >
                        {galleryImages.length > 0 ? 'Manage gallery' : 'Add gallery images'} <ChevronRight size={16} />
                      </Button>
                      
                      {galleryImages.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {galleryImages.slice(0, 2).map((image, index) => (
                            <div key={index} className="w-20 h-20 overflow-hidden rounded-lg bg-zinc-800">
                              {image.url && (
                                <img 
                                  src={image.url} 
                                  alt={`Gallery image ${index+1}`} 
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                          ))}
                          {galleryImages.length > 2 && (
                            <div className="w-20 h-20 flex items-center justify-center bg-zinc-800 rounded-lg">
                              <span className="text-xs text-gray-400">+{galleryImages.length - 2} more</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Select license */}
                <div className={`bg-zinc-900 rounded-md p-4 border ${checklist.hasLicense ? 'border-green-500' : 'border-red-500'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 text-2xl ${checklist.hasLicense ? 'text-green-500' : 'text-red-500'}`}>
                      {checklist.hasLicense ? <Check size={20} /> : '*'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <Scale size={16} />
                        Select license
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Select the license your project is distributed under.
                      </p>
                      <div className="mt-3">
                        <Select
                          value={formData.license}
                          onValueChange={(value) => {
                            setFormData(prev => ({...prev, license: value}));
                            // Auto-save the license selection
                            setTimeout(() => handleSubmit(), 100);
                          }}
                        >
                          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                            <SelectValue placeholder="Select license" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                            <SelectItem value="MIT">MIT License</SelectItem>
                            <SelectItem value="Apache-2.0">Apache License 2.0</SelectItem>
                            <SelectItem value="GPL-3.0">GNU GPL v3</SelectItem>
                            <SelectItem value="BSD-3-Clause">BSD 3-Clause</SelectItem>
                            <SelectItem value="CC-BY-4.0">Creative Commons BY 4.0</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Submit for review */}
                <div className={`bg-zinc-900 rounded-md p-4 border ${checklist.isReadyForReview ? 'border-yellow-600' : 'border-yellow-800 border-opacity-50'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 text-2xl ${checklist.isReadyForReview ? 'text-yellow-600' : 'text-yellow-800'}`}>
                      {checklist.isReadyForReview ? <Check size={20} /> : '⚖️'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <Send size={16} />
                        Submit for review
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Your project is only viewable by members of the project. It must be reviewed by moderators in order to be published.
                      </p>
                      <Button 
                        className={`mt-3 ${checklist.isReadyForReview ? 
                          'bg-yellow-600 hover:bg-yellow-700 text-black' : 
                          'bg-yellow-800 hover:bg-yellow-700 text-white'} font-bold w-full`}
                        onClick={submitForReview}
                        disabled={checklist.isReadyForReview || !checklist.hasVersion || !checklist.hasDescription || !checklist.hasLicense}
                      >
                        {checklist.isReadyForReview ? 'Submitted for review' : 'Submit for review'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Version Upload Dialog */}
      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Upload Version</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleVersionSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Version Number *</label>
              <Input
                value={versionData.version_number}
                onChange={(e) => setVersionData({...versionData, version_number: e.target.value})}
                placeholder="e.g. 1.0.0"
                required
                className="bg-zinc-800 border-zinc-700 text-white"
              />
              <p className="text-xs text-gray-400">
                Use semantic versioning (e.g. 1.0.0, 1.1.2)
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Changelog</label>
              <Textarea
                value={versionData.changelog}
                onChange={(e) => setVersionData({...versionData, changelog: e.target.value})}
                placeholder="What's new in this version? (optional)"
                rows={3}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Upload File *</label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white w-full py-6"
                >
                  {versionData.file ? (
                    <div className="flex items-center gap-2">
                      <Check size={18} className="text-green-400" />
                      <span className="truncate">{versionData.file.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={24} />
                      <span>Click to select file</span>
                    </div>
                  )}
                </Button>
              </div>
              {versionData.file && (
                <p className="text-xs text-gray-400">
                  File size: {Math.round(versionData.file.size / 1024)} KB
                </p>
              )}
            </div>
            
            <DialogFooter className="pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowVersionDialog(false)}
                className="border-zinc-700 text-white hover:bg-zinc-700"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-black font-bold"
                disabled={saving || !versionData.version_number || !versionData.file}
              >
                {saving ? "Uploading..." : "Upload Version"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Icon Upload Dialog */}
      <Dialog open={showIconDialog} onOpenChange={setShowIconDialog}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Upload Project Icon</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleIconSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Icon Image *</label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={iconInputRef}
                  accept="image/*"
                  className="hidden"
                />
                <Button 
                  type="button"
                  onClick={() => iconInputRef.current?.click()}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white w-full py-6"
                >
                  {iconInputRef.current?.files?.[0] ? (
                    <div className="flex items-center gap-2">
                      <Check size={18} className="text-green-400" />
                      <span className="truncate">{iconInputRef.current.files[0].name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon size={24} />
                      <span>Click to select image</span>
                      <p className="text-xs text-gray-400">Recommended: 512x512px</p>
                    </div>
                  )}
                </Button>
              </div>
            </div>
            
            <DialogFooter className="pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowIconDialog(false)}
                className="border-zinc-700 text-white hover:bg-zinc-700"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-black font-bold"
                disabled={saving || !iconInputRef.current?.files?.[0]}
              >
                {saving ? "Uploading..." : "Upload Icon"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Gallery Images Dialog */}
      <Dialog open={showGalleryDialog} onOpenChange={setShowGalleryDialog}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Gallery Images</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Upload New Image</label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={galleryInputRef}
                  accept="image/*"
                  className="hidden"
                />
                <Button 
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white flex-grow py-6"
                >
                  <div className="flex flex-col items-center gap-2">
                    <ImageIcon size={24} />
                    <span>Click to select image</span>
                    <p className="text-xs text-gray-400">Recommended: 16:9 aspect ratio</p>
                  </div>
                </Button>
                <Button 
                  onClick={handleGalleryImageSubmit}
                  className="bg-green-500 hover:bg-green-600 text-black font-bold h-[88px]"
                  disabled={saving || !galleryInputRef.current?.files?.[0]}
                >
                  {saving ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2 pt-4 border-t border-zinc-700">
              <h4 className="font-medium text-white">Gallery Images</h4>
              {galleryImages.length === 0 ? (
                <p className="text-sm text-gray-400">No images uploaded yet.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {galleryImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="overflow-hidden rounded-lg bg-zinc-800 aspect-video">
                        <img 
                          src={image.url} 
                          alt={`Gallery image ${index+1}`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        onClick={() => deleteGalleryImage(image.id)}
                        className="absolute top-2 right-2 bg-black bg-opacity-60 hover:bg-opacity-80 p-1.5 h-auto w-auto rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        variant="ghost"
                        size="icon"
                      >
                        <Trash2 size={16} className="text-white" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="pt-4 border-t border-zinc-700">
            <Button 
              variant="outline" 
              onClick={() => setShowGalleryDialog(false)}
              className="border-zinc-700 text-white hover:bg-zinc-700"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* External Links Dialog */}
      <Dialog open={showLinksDialog} onOpenChange={setShowLinksDialog}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">External Links</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLinksSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Add Link</label>
              <div className="flex items-center gap-2">
                <Select
                  value={newLink.type}
                  onValueChange={(value) => setNewLink({...newLink, type: value})}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="discord">Discord</SelectItem>
                    <SelectItem value="documentation">Documentation</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={newLink.url}
                  onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                  placeholder="https://"
                  className="bg-zinc-800 border-zinc-700 text-white flex-grow"
                />
                <Button 
                  type="button"
                  onClick={addLink}
                  className="bg-zinc-800 hover:bg-zinc-700"
                >
                  <Plus size={18} />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2 pt-4 border-t border-zinc-700">
              <h4 className="font-medium text-white">Current Links</h4>
              {links.length === 0 ? (
                <p className="text-sm text-gray-400">No links added yet.</p>
              ) : (
                <div className="space-y-2 mt-2">
                  {links.map((link, index) => (
                    <div key={index} className="flex items-center gap-2 bg-zinc-800 p-2 rounded">
                      <div className="flex items-center gap-2 flex-grow">
                        {getLinkIcon(link.type)}
                        <span className="text-sm truncate">{link.url}</span>
                      </div>
                      <Button
                        onClick={() => removeLink(index)}
                        className="p-1.5 h-auto w-auto bg-zinc-700 hover:bg-zinc-600"
                        size="icon"
                      >
                        <X size={16} className="text-white" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <DialogFooter className="pt-4 border-t border-zinc-700">
              <Button 
                variant="outline" 
                onClick={() => setShowLinksDialog(false)}
                className="border-zinc-700 text-white hover:bg-zinc-700"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-black font-bold"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Links"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}