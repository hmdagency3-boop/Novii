import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Profile } from "@/lib/api";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { AvatarUploader } from "@/components/avatar-uploader";
import { Camera, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { invalidateCacheByPattern } from "@/lib/cache-utils";
import { validateUsernameComplete, validateUsernameFormat } from "@/lib/username-validation";

interface EditProfileDialogProps {
  profile: Profile;
  trigger?: React.ReactNode;
  children?: React.ReactNode;
  onProfileUpdate?: () => void;
}

export function EditProfileDialog({ profile, trigger, children, onProfileUpdate }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: profile.username || "",
    full_name: profile.full_name || "",
    bio: profile.bio || "",
    website: profile.website || "",
    location: profile.location || "",
    avatar_url: profile.avatar_url || "",
    cover_url: profile.cover_url || "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>("");
  const [coverUploadProgress, setCoverUploadProgress] = useState(0);
  
  // Username validation state
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameIsValid, setUsernameIsValid] = useState(true);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const usernameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Username suggestions state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Validate username in real-time
  useEffect(() => {
    if (!formData.username || formData.username === profile.username) {
      setUsernameError(null);
      setUsernameIsValid(true);
      return;
    }

    setUsernameChecking(true);

    if (usernameCheckTimeoutRef.current) {
      clearTimeout(usernameCheckTimeoutRef.current);
    }

    usernameCheckTimeoutRef.current = setTimeout(async () => {
      const result = await validateUsernameComplete(formData.username, profile.id);
      setUsernameError(result.error);
      setUsernameIsValid(result.isValid);
      setUsernameChecking(false);
    }, 500);

    return () => {
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
    };
  }, [formData.username, profile.username, profile.id]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<Profile>) => {
      // Only send fields that have actually changed
      const changedFields: Partial<Profile> = {};
      let hasChanges = false;

      // Check each field for changes
      if (data.username !== profile.username) {
        changedFields.username = data.username;
        hasChanges = true;
      }
      if (data.full_name !== profile.full_name) {
        changedFields.full_name = data.full_name;
        hasChanges = true;
      }
      if (data.bio !== profile.bio) {
        changedFields.bio = data.bio;
        hasChanges = true;
      }
      if (data.website !== profile.website) {
        changedFields.website = data.website;
        hasChanges = true;
      }
      if (data.location !== profile.location) {
        changedFields.location = data.location;
        hasChanges = true;
      }

      // Upload cover first if a file is selected
      if (selectedCoverFile) {
        const coverUrl = await api.uploadCover(selectedCoverFile, (progress) => {
          setCoverUploadProgress(progress);
        });
        changedFields.cover_url = coverUrl;
        hasChanges = true;
      }
      
      // Upload avatar if a file is selected
      if (selectedFile) {
        const avatarUrl = await api.uploadAvatar(selectedFile, (progress) => {
          setUploadProgress(progress);
        });
        changedFields.avatar_url = avatarUrl;
        hasChanges = true;
      }

      // Only call updateProfile if there are actual changes
      if (!hasChanges) {
        return profile;
      }

      const result = await api.updateProfile(changedFields);
      return result;
    },
    onSuccess: (updatedProfile) => {
      // 1. Clear local cache first (localStorage + memory cache)
      invalidateCacheByPattern('profile');
      
      // 2. Update React Query data with merged data
      if (user?.id) {
        const currentData = queryClient.getQueryData(['profile', user.id]) as Profile | undefined;
        const mergedData = currentData ? { ...currentData, ...updatedProfile } : updatedProfile;
        queryClient.setQueryData(['profile', user.id], mergedData);
      }
      
      // 3. Trigger profile refetch immediately to ensure fresh data
      if (onProfileUpdate) {
        onProfileUpdate();
      }
      
      // 4. Force refetch profile queries to ensure sidebar and all places update immediately
      queryClient.refetchQueries({
        queryKey: ['profile', user?.id],
        type: 'active'
      });
      
      // 5. Invalidate all profile-related queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          if (!Array.isArray(key)) return false;
          
          // List of all query keys that might contain profile data with avatar
          const profileRelatedKeys = [
            'profile',          // All profile queries
            'feed',             // Feed posts with profile data
            'posts',            // Posts with profile data
            'post',             // Individual post with profile data
            'explore',          // Explore posts with profile data
            'comments',         // Comments with profile data
            'stories',          // Stories with profile data
            'userStories',      // User stories with profile data
            'followers',        // Followers with profile data
            'following',        // Following with profile data
            'messages',         // Messages with profile data
            'conversations',    // Conversations with profile data
            'notifications',    // Notifications with profile data
            'suggestions',      // Suggestions with profile data
            'reels',            // Reels with profile data
            'userReels',        // User reels with profile data
            'mentions',         // Mentions with profile data
            'saved',            // Saved posts with profile data
            'userPosts',        // User posts with profile data
          ];
          
          return profileRelatedKeys.includes(key[0] as string);
        }
      });
      
      toast.success("Profile updated successfully!");
      setOpen(false);
      setSelectedFile(null);
      setPreviewUrl("");
      setUploadProgress(0);
      setSelectedCoverFile(null);
      setCoverPreviewUrl("");
      setCoverUploadProgress(0);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update profile");
      setUploadProgress(0);
      setCoverUploadProgress(0);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if username has changed and validate it
    if (formData.username !== profile.username) {
      if (!usernameIsValid || usernameError) {
        toast.error(usernameError || "Please fix username validation errors");
        return;
      }
    }

    updateProfileMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl("");
  };

  const handleCoverFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size should be less than 10MB');
      return;
    }

    setSelectedCoverFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCover = () => {
    setSelectedCoverFile(null);
    setCoverPreviewUrl("");
    handleChange("cover_url", "");
  };

  // Fetch username suggestions
  const fetchSuggestions = async (partial: string) => {
    if (!partial || partial.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/suggest-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partial }),
      });

      if (!response.ok) return;

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setShowSuggestions(data.suggestions && data.suggestions.length > 0);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleUsernameChange = (value: string) => {
    handleChange("username", value);
    
    // Clear existing timeout
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    // Fetch suggestions after user stops typing
    suggestionTimeoutRef.current = setTimeout(() => {
      if (value && value !== profile.username) {
        fetchSuggestions(value);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  };

  const selectSuggestion = (suggestion: string) => {
    handleChange("username", suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || children}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Profile</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Photo Uploader */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Cover Photo</label>
            <div className="relative w-full h-32 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-lg overflow-hidden group">
              {(coverPreviewUrl || formData.cover_url) && (
                <img 
                  src={coverPreviewUrl || formData.cover_url} 
                  alt="Cover preview" 
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleCoverFileSelect(e.target.files[0])}
                    disabled={updateProfileMutation.isPending}
                  />
                  <div className="bg-white/90 hover:bg-white text-black rounded-full p-2 transition-colors">
                    <Camera className="w-5 h-5" />
                  </div>
                </label>
                {(coverPreviewUrl || formData.cover_url) && (
                  <button
                    type="button"
                    onClick={handleRemoveCover}
                    className="bg-white/90 hover:bg-white text-black rounded-full p-2 transition-colors"
                    disabled={updateProfileMutation.isPending}
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              {coverUploadProgress > 0 && coverUploadProgress < 100 && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50">
                  <Progress value={coverUploadProgress} className="h-1" />
                </div>
              )}
            </div>
          </div>

          {/* Avatar Uploader */}
          <AvatarUploader
            currentAvatar={formData.avatar_url}
            username={profile.username}
            onFileSelect={handleFileSelect}
            onRemove={handleRemovePhoto}
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            isUploading={updateProfileMutation.isPending}
            uploadProgress={uploadProgress}
          />

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Username</label>
              <div className="relative">
                <Input
                  value={formData.username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  onFocus={() => formData.username && formData.username !== profile.username && showSuggestions && setSuggestions(suggestions)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Username"
                  className={`bg-background pr-10 ${
                    formData.username !== profile.username
                      ? usernameIsValid && !usernameError
                        ? 'border-green-500'
                        : 'border-destructive'
                      : ''
                  }`}
                />
                {formData.username !== profile.username && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {usernameChecking ? (
                      <Spinner className="w-4 h-4 text-muted-foreground" />
                    ) : usernameIsValid && !usernameError ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                )}
                
                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md z-50">
                    <div className="max-h-40 overflow-y-auto">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => selectSuggestion(suggestion)}
                          className="w-full text-left px-3 py-2 hover:bg-accent transition-colors text-sm"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {formData.username !== profile.username && usernameError && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  {usernameError}
                </p>
              )}
              {formData.username !== profile.username && usernameIsValid && !usernameError && (
                <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Username is available!
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Name</label>
              <Input
                value={formData.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                placeholder="Full name"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-semibold">Bio</label>
                <span className="text-xs text-muted-foreground">{formData.bio.length} / 150</span>
              </div>
              <Textarea
                value={formData.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                placeholder="Write a bio..."
                className="bg-background resize-none"
                maxLength={150}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Website</label>
              <Input
                value={formData.website}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="https://example.com"
                className="bg-background"
                type="url"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Location</label>
              <Input
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="City, Country"
                className="bg-background"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={updateProfileMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={
                updateProfileMutation.isPending ||
                (formData.username !== profile.username && (!usernameIsValid || !!usernameError)) ||
                usernameChecking
              }
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
