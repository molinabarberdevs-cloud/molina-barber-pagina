/// <reference types="astro/client" />

declare namespace App {
  interface Locals extends Astro.Locals {
    session: import('@supabase/supabase-js').Session | null;
    isLoggedIn: boolean;
    isAdmin: boolean;
    barbero: { id: string; nombre: string; pin?: string; activo?: boolean; creado_en?: string } | null;
  }
}