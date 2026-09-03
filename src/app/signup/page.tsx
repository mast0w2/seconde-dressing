"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { createBrowserClient } from "@supabase/ssr";
import { Role } from "@/types/database";
import { ChevronLeft, User, Mail, Phone, Home, MapPin } from "lucide-react";
import { useState, useEffect } from "react";

type FormValues = {
  email: string;
  password: string;
  confirmPassword: string;
  nom: string;
  prenom: string;
  telephone: string;
  adresse_rue: string;
  adresse_ville: string;
  adresse_code_postal: string;
  role: Role;
};

const formSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string().min(6, "Les mots de passe ne correspondent pas"),
  nom: z.string().min(2, "Le nom est requis"),
  prenom: z.string().min(2, "Le prénom est requis"),
  telephone: z.string().min(10, "Le téléphone est requis"),
  adresse_rue: z.string().min(5, "L'adresse est requise"),
  adresse_ville: z.string().min(2, "La ville est requise"),
  adresse_code_postal: z.string().min(5, "Le code postal est requis"),
  role: z.enum(["client", "vendeur"] as [Role, ...Role[]], {
    errorMap: () => ({ message: "Veuillez sélectionner un rôle" }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  // Get pre-selected role from sessionStorage or query params
  const [preSelectedRole, setPreSelectedRole] = useState<Role | null>(null);

  useEffect(() => {
    // Check sessionStorage first
    const storedRole = sessionStorage.getItem("selectedRole") as Role | null;
    if (storedRole) {
      setPreSelectedRole(storedRole);
    }
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      nom: "",
      prenom: "",
      telephone: "",
      adresse_rue: "",
      adresse_ville: "",
      adresse_code_postal: "",
      role: preSelectedRole || "client",
    },
  });

  const { handleSubmit, register, formState, watch, setValue } = form;
  const { errors, isSubmitting } = formState;
  const role = watch("role");

  // Update role when preSelectedRole changes
  useEffect(() => {
    if (preSelectedRole) {
      setValue("role", preSelectedRole);
    }
  }, [preSelectedRole, setValue]);

  const onSubmit = async (data: FormValues) => {
    try {
      // Check if email already exists
      const { data: existingUser } = await supabase.auth.getUser();
      
      if (existingUser?.user?.email === data.email) {
        toast({
          title: "Email déjà utilisé",
          description: "Un compte existe déjà avec cette adresse email. Veuillez vous connecter.",
          variant: "destructive",
        });
        return;
      }

      // Check if email exists in profiles
      const { data: existingProfile, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .eq("email", data.email)
        .single();

      if (existingProfile) {
        toast({
          title: "Email déjà utilisé",
          description: "Un compte existe déjà avec cette adresse email. Veuillez vous connecter.",
          variant: "destructive",
        });
        return;
      }

      // Create auth user
      const { error: authError, data: authData } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error("User not created");
      }

      // Create profile with all information
      const profileData = {
        id: authData.user.id,
        email: authData.user.email,
        nom: data.nom,
        prenom: data.prenom,
        telephone: data.telephone,
        adresse_rue: data.adresse_rue,
        adresse_ville: data.adresse_ville,
        adresse_code_postal: data.adresse_code_postal,
        adresse_pays: "France",
        role: data.role,
        photo_url: null,
        bio: null,
        specialisation: null,
        tarif_horaire: null,
        annees_experience: null,
      };

      const { error: profileError2 } = await supabase
        .from("profiles")
        .insert([profileData]);

      if (profileError2) {
        throw profileError2;
      }

      // Create default preferences
      const { error: prefError } = await supabase
        .from("preferences")
        .insert([{
          user_id: authData.user.id,
          langue: "FR",
          fuseau_horaire: "Europe/Paris",
          theme: "clair",
          notifications_email: true,
          notifications_sms: false,
        }]);

      if (prefError) {
        console.error("Error creating preferences:", prefError);
      }

      toast({
        title: "Inscription réussie",
        description: "Veuillez vérifier votre email pour confirmer votre compte.",
      });

      // Redirect based on role
      router.push(data.role === "vendeur" ? "/vendeur" : "/");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="h-10 w-10 p-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <CardTitle className="text-2xl">Créer un compte</CardTitle>
              <CardDescription>
                {preSelectedRole === "vendeur" 
                  ? "Devenez vendeur et commencez à gagner de l'argent"
                  : "Inscrivez-vous pour commencer à utiliser Seconde"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations personnelles
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom *</Label>
                  <Input
                    id="prenom"
                    placeholder="Jean"
                    {...register("prenom")}
                    className={errors.prenom ? "border-destructive" : ""}
                  />
                  {errors.prenom && (
                    <p className="text-sm text-destructive">{errors.prenom.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    placeholder="Dupont"
                    {...register("nom")}
                    className={errors.nom ? "border-destructive" : ""}
                  />
                  {errors.nom && (
                    <p className="text-sm text-destructive">{errors.nom.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  {...register("email")}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone *</Label>
                <Input
                  id="telephone"
                  type="tel"
                  placeholder="+33 1 23 45 67 89"
                  {...register("telephone")}
                  className={errors.telephone ? "border-destructive" : ""}
                />
                {errors.telephone && (
                  <p className="text-sm text-destructive">{errors.telephone.message}</p>
                )}
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Home className="h-5 w-5" />
                Adresse
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="adresse_rue">Rue et numéro *</Label>
                <Input
                  id="adresse_rue"
                  placeholder="123 Rue de Paris"
                  {...register("adresse_rue")}
                  className={errors.adresse_rue ? "border-destructive" : ""}
                />
                {errors.adresse_rue && (
                  <p className="text-sm text-destructive">{errors.adresse_rue.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adresse_ville">Ville *</Label>
                  <Input
                    id="adresse_ville"
                    placeholder="Paris"
                    {...register("adresse_ville")}
                    className={errors.adresse_ville ? "border-destructive" : ""}
                  />
                  {errors.adresse_ville && (
                    <p className="text-sm text-destructive">{errors.adresse_ville.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adresse_code_postal">Code postal *</Label>
                  <Input
                    id="adresse_code_postal"
                    placeholder="75001"
                    {...register("adresse_code_postal")}
                    className={errors.adresse_code_postal ? "border-destructive" : ""}
                  />
                  {errors.adresse_code_postal && (
                    <p className="text-sm text-destructive">{errors.adresse_code_postal.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Mot de passe
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••••••"
                  {...register("password")}
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••••••"
                  {...register("confirmPassword")}
                  className={errors.confirmPassword ? "border-destructive" : ""}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Role Selection - Only shown if not pre-selected */}
            {!preSelectedRole && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Quel est votre rôle ? *
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      role === "client" 
                        ? "border-primary bg-primary/5" 
                        : "border-noir/20 hover:border-noir/40"
                    }`}
                    onClick={() => setValue("role", "client")}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        role === "client" ? "bg-primary" : "bg-noir/10"
                      }`}>
                        {role === "client" && <div className="w-3 h-3 bg-blanc rounded-full" />}
                      </div>
                      <div>
                        <div className="font-medium">Client</div>
                        <div className="text-sm text-muted-foreground">
                          Je veux vendre mes vêtements
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      role === "vendeur" 
                        ? "border-primary bg-primary/5" 
                        : "border-noir/20 hover:border-noir/40"
                    }`}
                    onClick={() => setValue("role", "vendeur")}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        role === "vendeur" ? "bg-primary" : "bg-noir/10"
                      }`}>
                        {role === "vendeur" && <div className="w-3 h-3 bg-blanc rounded-full" />}
                      </div>
                      <div>
                        <div className="font-medium">Vendeur</div>
                        <div className="text-sm text-muted-foreground">
                          J'aide à vendre des vêtements
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {errors.role && (
                  <p className="text-sm text-destructive">{errors.role.message}</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Création..." : "Créer mon compte"}
            </Button>

            {/* Login Link */}
            <p className="text-center text-sm text-muted-foreground">
              Vous avez déjà un compte ?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Se connecter
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
