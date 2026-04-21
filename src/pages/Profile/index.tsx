import { useNavigate, useSearchParams } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect } from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";


import { useMutation } from "@tanstack/react-query";
import {
  Camera,
  MapPin,
  Edit,
  Loader,
  Trash2,
  User,
  Building2,
  Briefcase,
  Phone,
  CheckCircle2,
  Shield
} from "lucide-react";
import { toast } from "sonner";

import { logout, updateProfile, useAppDispatch, useAppSelector } from "@/redux";
import { userService } from "@/services/users/users";
import { useErrorLog } from "@/hooks/use-error-log";
// import { useErrorLog } from "@/hooks";


/* ---------------- Helpers ---------------- */
const displayValue = (value: unknown): string =>
  value === undefined || value === null || value === ""
    ? "—"
    : String(value);

const getInitials = (profile: Record<string, unknown> | null, user: Record<string, unknown> | null) => {
  const fname = (profile?.fname || profile?.first_name || user?.first_name) as string | undefined;
  const lname = (profile?.lname || profile?.last_name || user?.last_name) as string | undefined;
  if (fname || lname) {
    return `${(fname || "").charAt(0)}${(lname || "").charAt(0)}`.toUpperCase();
  }
  return (user?.username as string)?.split("@")[0]?.charAt(0)?.toUpperCase() || "U";
};

const getFullName = (profile: Record<string, unknown> | null, user: Record<string, unknown> | null) => {
  if (profile?.full_name) return profile.full_name as string;
  const fname = (profile?.fname || user?.first_name || "") as string;
  const lname = (profile?.lname || user?.last_name || "") as string;
  if (fname || lname) return `${fname} ${lname}`.trim();
  return (user?.username as string)?.split("@")[0] || "New User";
};

const calculateProfileCompletion = (profile: Record<string, unknown> | null, user: Record<string, unknown> | null) => {
  const fields = [
    profile?.fname || user?.first_name,
    profile?.lname || user?.last_name,
    profile?.company,
    profile?.department,
    profile?.designation,
    profile?.location,
    // profile?.phone || user?.phone,
  ];
  const filled = fields.filter(f => f && f !== "").length;
  return Math.round((filled / fields.length) * 100);
};

/* ---------------- Validation Schema ---------------- */
const profileSchema = z.object({
  fname: z.string().min(1, "First name is required"),
  lname: z.string().min(1, "Last name is required"),
  company: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  company_role: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
});

/* ---------------- Info Item Component ---------------- */
const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: unknown }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-sm font-semibold truncate">{displayValue(value)}</p>
    </div>
  </div>
);

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isEditMode = searchParams.get("edit") === "true";

  const handleError = useErrorLog("/profile");
  const dispatch = useAppDispatch();

  const { userSession } = useAppSelector((state: { session: { userSession: Record<string, unknown> | null } }) => state.session);
  const user = userSession?.user as Record<string, unknown> | null;
  const profile = userSession?.profile as Record<string, unknown> | null;
  const user_id = user?.id as string | undefined;

  const profileCompletion = calculateProfileCompletion(profile, user);
  const isProfileComplete = profileCompletion === 100;

  const form = useForm({
    resolver: zodResolver(profileSchema),
    values: {
      fname: (profile?.fname || user?.first_name || "") as string,
      lname: (profile?.lname || user?.last_name || "") as string,
      company: (profile?.company || "") as string,
      department: (profile?.department || "") as string,
      designation: (profile?.designation || "") as string,
      company_role: (profile?.company_role || "") as string,
      location: (profile?.location || "") as string,
      phone: (profile?.phone || user?.phone || "") as string,
    },
  });

  useEffect(() => {
    form.reset({
      fname: (profile?.fname || user?.first_name || "") as string,
      lname: (profile?.lname || user?.last_name || "") as string,
      company: (profile?.company || "") as string,
      department: (profile?.department || "") as string,
      designation: (profile?.designation || "") as string,
      company_role: (profile?.company_role || "") as string,
      location: (profile?.location || "") as string,
      phone: (profile?.phone || user?.phone || "") as string,
    });
  }, [profile, user, form]);

  const { formState: { isSubmitting } } = form;

  /* ---------------- Mutation ---------------- */
  const updateProfileMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => {
      if (!user_id) throw new Error("User not available");
      return userService.updateProfile(user_id, payload);
    },

    onSuccess: (response) => {
      const updatedProfile = response as Record<string, unknown>;

      dispatch(updateProfile(updatedProfile));
      setSearchParams({ edit: "false" });
      toast.success("Profile updated successfully");
    },

    onError: (error) => {
      handleError(error);
    },
  });

  const onSubmit = async (data: Record<string, unknown>) => {
    updateProfileMutation.mutateAsync(data);
  };

  /* ---------------- Delete Account Mutation ---------------- */
  const deleteAccountMutation = useMutation({
    mutationFn: () => {
      if (!user_id) throw new Error("User not available");
      return userService.deleteUser(user_id);
    },
    onSuccess: async () => {
      dispatch(logout());
      navigate("/", { replace: true });
    },
    onError: (error) => {
      handleError(error);
    },
  });

  return (
      <div className="p-4 md:p-6 space-y-6 ">

        {/* ---------- Profile Header Card ---------- */}
        <Card className="relative overflow-hidden ">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          </div>

          <CardContent className="relative p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 md:items-center">
              {/* Avatar Section */}
              <div className="relative group">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-primary/50 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <Avatar className="h-28 w-28 md:h-32 md:w-32 border-4 border-background shadow-xl">
                  <AvatarImage src={user?.profile_image as string} />
                  <AvatarFallback className="text-3xl font-bold bg-primary/20">
                    {getInitials(profile, user)}
                  </AvatarFallback>
                </Avatar>
                {isEditMode && (
                  <button
                    className="absolute -right-1 -bottom-1 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Info Section */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold capitalize">
                      {getFullName(profile, user)}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">{user?.username as string}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      variant={user?.is_active ? "default" : "secondary"}
                      className={user?.is_active ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20" : ""}
                    >
                      {user?.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      {isProfileComplete ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Shield className="h-3 w-3" />
                      )}
                      {isProfileComplete ? "Verified" : "Incomplete"}
                    </Badge>
                  </div>
                </div>

                {/* Profile Completion */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Profile Completion</span>
                    <span className="font-semibold">{profileCompletion}%</span>
                  </div>
                  <Progress
                    value={profileCompletion}
                    className="h-2"
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="flex-shrink-0">
                {isEditMode ? (
                  ""
                ) : (
                  <Button
                    type="button"
                    onClick={() => navigate("/dashboard/profile?edit=true")}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ---------- Profile Details Card ---------- */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Update your personal and work information</CardDescription>
          </CardHeader>

          <CardContent>
            {isEditMode ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      ["fname", "First Name"],
                      ["lname", "Last Name"],
                      ["company", "Company"],
                      ["department", "Department"],
                      ["designation", "Designation"],
                      ["company_role", "Company Role"],
                      ["phone", "Phone"],
                      ["location", "Location"],
                    ].map(([name, label]) => (
                      <FormField
                        key={name}
                        control={form.control}
                        name={name as "fname" | "lname" | "company" | "department" | "designation" | "company_role" | "phone" | "location"}
                        render={({ field }) => (
                          <FormItem className={name === "location" ? "md:col-span-2" : ""}>
                            <FormLabel>{label}</FormLabel>
                            <FormControl>
                              <Input
                                autoComplete="off"
                                placeholder={`Enter ${label?.toLowerCase()}`}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-5">
                    <Button type="button" variant="outline" onClick={() => navigate("/dashboard/profile")}>
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      disabled={isSubmitting || updateProfileMutation.isPending}
                    >
                      {(isSubmitting || updateProfileMutation.isPending) && (
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save Profile
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem icon={User} label="First Name" value={profile?.fname || user?.first_name} />
                <InfoItem icon={User} label="Last Name" value={profile?.lname || user?.last_name} />
                <InfoItem icon={Building2} label="Company" value={profile?.company || "—"} />
                <InfoItem icon={Briefcase} label="Department" value={profile?.department || "—"} />
                <InfoItem icon={Briefcase} label="Designation" value={profile?.designation || "—"} />
                <InfoItem icon={User} label="Company Role" value={profile?.company_role || "—"} />
                <InfoItem icon={Phone} label="Phone" value={profile?.phone || user?.phone} />
                <InfoItem icon={MapPin} label="Location" value={profile?.location || "Not specified"} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* ---------- Danger Zone ---------- */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-destructive text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Danger Zone
            </CardTitle>
            <CardDescription className="text-destructive/70">
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Delete Account</Label>
                <p className="text-muted-foreground text-sm">
                  Permanently delete your account and all data
                </p>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={deleteAccountMutation.isPending}
                  >
                    {deleteAccountMutation.isPending ? (
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Delete Account
                  </Button>
                </AlertDialogTrigger>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove all associated data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>

                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => deleteAccountMutation.mutate()}
                      disabled={deleteAccountMutation.isPending}
                    >
                      {deleteAccountMutation.isPending ? "Deleting..." : "Yes, delete account"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

            </div>
          </CardContent>
        </Card>

      </div>
  );
};

export default Profile;
