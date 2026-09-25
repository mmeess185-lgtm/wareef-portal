import { supabase } from "../supabaseClient";

export async function sendMagicLink(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function signInWithPassword(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUpWithPassword(email, password) {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
}

// Sends a password-reset email with a link back to the app.
export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
}

// Called after the user clicks the reset link and returns to the app,
// to set their chosen new password.
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => callback(session, event));
  return () => data.subscription.unsubscribe();
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Looks up the matching row in public.users for the signed-in account.
// Returns null if the trigger hasn't linked a profile yet (rare race on first sign-in).
export async function fetchMyProfile(userId) {
  const { data, error } = await supabase
    .from("users")
    .select("id, role, full_name, email, phone, preferred_lang")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
