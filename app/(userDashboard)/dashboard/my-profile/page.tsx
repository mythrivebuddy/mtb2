"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UploadCloud, Instagram, Linkedin, Globe, Loader2, Pencil, UserPlus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, ProfileFormType } from "@/schema/zodSchema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { getAxiosErrorMessage } from "@/utils/ax";
import { getInitials } from "@/utils/getInitials";



interface ProfileResponse {
  profile: {
    fullName: string;
    bio?: string;
    skills?: string;
    instagram?: string;
    linkedin?: string;
    website?: string;
    profilePicture?: string | null;
  };
}

export default function MyProfile() {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [newProfileImage, setNewProfileImage] = useState<File | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasProfile, setHasProfile] = useState<boolean | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<ProfileFormType>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      bio: "",
      skills: "",
      instagram: "",
      linkedin: "",
      website: "",
    }
  });

  // Fetch user profile data
  const { data: profileData, isLoading: isLoadingProfile} = useQuery<ProfileResponse>({
    queryKey: ['userProfile'],
    queryFn: async () => {
      try {
        const response = await axios.get<ProfileResponse>('/api/user/my-profile');
        setHasProfile(true);
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 404) {
          // Profile doesn't exist
          setHasProfile(false);
          
        }
        throw error;
      }
    },
  });

  // Update form with profile data when available
  useEffect(() => {
    if (profileData?.profile) {
      const { profile } = profileData;
      Object.entries(profile).forEach(([key, value]) => {
        if (key !== 'profilePicture' && value !== undefined) {
          setValue(key as keyof ProfileFormType, value as string);
        }
      });
      
      // Set profile image if available
      if (profile.profilePicture) {
        setProfileImage(profile.profilePicture);
      }
    }
  }, [profileData, setValue]);

  // Save profile data
  const saveProfileMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post<ProfileResponse>('/api/user/my-profile', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(hasProfile === true ? "Profile updated successfully!" : "Profile created successfully!");
      if (data.profile.profilePicture) {
        console.log("Profile picture URL:", data.profile.profilePicture);
        setProfileImage(data.profile.profilePicture);
        setNewProfileImage(null);
      }
      setIsEditMode(false); // Exit edit mode after saving
      setHasProfile(true); // Profile now exists
      
      // Invalidate and refetch the userProfile query to update Topbar immediately
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      
      // Dispatch a custom event to notify other components of profile update
      const profileUpdatedEvent = new CustomEvent('profileUpdated', { 
        detail: { 
          profilePicture: data.profile.profilePicture,
          fullName: data.profile.fullName
        } 
      });
      window.dispatchEvent(profileUpdatedEvent);
    },
    onError: (error) => {
      toast.error(getAxiosErrorMessage(error, "Failed to save profile"));
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewProfileImage(file);
      
      // Create preview URL for immediate UI update
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    if (isEditMode || hasProfile === false) {
      fileInputRef.current?.click();
    }
  };

  const onSubmit = (formData: ProfileFormType) => {
    const submitData = new FormData();
    
    // Add form fields to FormData
    Object.entries(formData).forEach(([key, value]) => {
      if (value) {
        submitData.append(key, value);
      }
    });
    
    // Add profile image if there's a new one
    if (newProfileImage) {
      submitData.append('profilePicture', newProfileImage);
    }
    
    saveProfileMutation.mutate(submitData);
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };


  // Loading state
  if (isLoadingProfile ) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Create Profile View - When no profile exists
  if (hasProfile === false) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">Create Profile</CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col gap-6">
            <div className="bg-muted p-4 rounded-lg mb-4">
              <div className="flex items-center gap-3">
                <UserPlus className="text-primary h-5 w-5" />
                <p className="text-sm">It looks like you have not set up your profile yet. Please fill in the form below to create your profile.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <Avatar 
                  className="h-16 w-16 cursor-pointer" 
                  onClick={handleImageClick}
                >
                  {profileImage ? (
                    <AvatarImage src={profileImage} alt="Profile" />
                  ) : null}
                  <AvatarFallback>
                    {getInitials(profileData?.profile?.fullName || "")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label className="flex items-center gap-2 cursor-pointer" onClick={handleImageClick}>
                    <UploadCloud size={20} /> Upload Profile Picture
                  </Label>
                  <Input 
                    type="file" 
                    className="mt-2 hidden" 
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Click on the Profile Picture to change your profile picture</p>
                </div>
              </div>

              <div>
                <Label>Full Name</Label>
                <Input
                  {...register("fullName")}
                  placeholder="Enter your full name"
                />
                {errors.fullName && (
                  <p className="text-sm text-red-500 mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <Label>Bio / About Me</Label>
                <Input
                  {...register("bio")}
                  placeholder="Write a short intro..."
                />
                {errors.bio && (
                  <p className="text-sm text-red-500 mt-1">{errors.bio.message}</p>
                )}
              </div>

              <div>
                <Label>Skills / Focus Areas</Label>
                <Input
                  {...register("skills")}
                  placeholder="Eg. Marketing, Coaching, Branding"
                />
                {errors.skills && (
                  <p className="text-sm text-red-500 mt-1">{errors.skills.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <Instagram size={18} /> Instagram
                  </Label>
                  <Input
                    {...register("instagram")}
                    placeholder="Instagram Profile URL"
                  />
                  {errors.instagram && (
                    <p className="text-sm text-red-500 mt-1">{errors.instagram.message}</p>
                  )}
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Linkedin size={18} /> LinkedIn
                  </Label>
                  <Input
                    {...register("linkedin")}
                    placeholder="LinkedIn Profile URL"
                  />
                  {errors.linkedin && (
                    <p className="text-sm text-red-500 mt-1">{errors.linkedin.message}</p>
                  )}
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Globe size={18} /> Website
                  </Label>
                  <Input
                    {...register("website")}
                    placeholder="Website URL"
                  />
                  {errors.website && (
                    <p className="text-sm text-red-500 mt-1">{errors.website.message}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 mt-6">
                <Button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2"
                  disabled={saveProfileMutation.isPending}
                >
                  {saveProfileMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" />
                      Creating...
                    </>
                  ) : (
                    "Create Profile"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // View/Edit Profile - When profile exists
  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card className="rounded-2xl shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">My Profile</CardTitle>
          {!isEditMode ? (
            <Button
              onClick={toggleEditMode}
              className="flex items-center gap-2"
            >
              <Pencil size={16} />
              Edit Profile
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={toggleEditMode}
              className="flex items-center gap-2"
            >
              Cancel
            </Button>
          )}
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Avatar 
                className={`h-16 w-16 ${isEditMode ? 'cursor-pointer' : ''}`} 
                onClick={handleImageClick}
              >
                {profileImage ? (
                  <AvatarImage src={profileImage} alt="Profile" />
                ) : null}
                <AvatarFallback>
                  {getInitials(profileData?.profile?.fullName || "")}
                </AvatarFallback>
              </Avatar>
              {isEditMode && (
                <div>
                  <Label className="flex items-center gap-2 cursor-pointer" onClick={handleImageClick}>
                    <UploadCloud size={20} /> Upload Profile Picture
                  </Label>
                  <Input 
                    type="file" 
                    className="mt-2 hidden" 
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Click on the avatar to change your profile picture</p>
                </div>
              )}
            </div>

            <div>
              <Label>Full Name</Label>
              <Input
                {...register("fullName")}
                placeholder="Enter your full name"
                disabled={!isEditMode}
                className={!isEditMode ? "bg-muted" : ""}
              />
              {errors.fullName && (
                <p className="text-sm text-red-500 mt-1">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <Label>Bio / About Me</Label>
              <Input
                {...register("bio")}
                placeholder="Write a short intro..."
                disabled={!isEditMode}
                className={!isEditMode ? "bg-muted" : ""}
              />
              {errors.bio && (
                <p className="text-sm text-red-500 mt-1">{errors.bio.message}</p>
              )}
            </div>

            <div>
              <Label>Skills / Focus Areas</Label>
              <Input
                {...register("skills")}
                placeholder="Eg. Marketing, Coaching, Branding"
                disabled={!isEditMode}
                className={!isEditMode ? "bg-muted" : ""}
              />
              {errors.skills && (
                <p className="text-sm text-red-500 mt-1">{errors.skills.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Instagram size={18} /> Instagram
                </Label>
                <Input
                  {...register("instagram")}
                  placeholder="Instagram Profile URL"
                  disabled={!isEditMode}
                  className={!isEditMode ? "bg-muted" : ""}
                />
                {errors.instagram && (
                  <p className="text-sm text-red-500 mt-1">{errors.instagram.message}</p>
                )}
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Linkedin size={18} /> LinkedIn
                </Label>
                <Input
                  {...register("linkedin")}
                  placeholder="LinkedIn Profile URL"
                  disabled={!isEditMode}
                  className={!isEditMode ? "bg-muted" : ""}
                />
                {errors.linkedin && (
                  <p className="text-sm text-red-500 mt-1">{errors.linkedin.message}</p>
                )}
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Globe size={18} /> Website
                </Label>
                <Input
                  {...register("website")}
                  placeholder="Website URL"
                  disabled={!isEditMode}
                  className={!isEditMode ? "bg-muted" : ""}
                />
                {errors.website && (
                  <p className="text-sm text-red-500 mt-1">{errors.website.message}</p>
                )}
              </div>
            </div>

            {isEditMode && (
              <div className="flex flex-col md:flex-row gap-4 mt-6">
                <Button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2"
                  disabled={saveProfileMutation.isPending}
                >
                  {saveProfileMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" />
                      Updating...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
