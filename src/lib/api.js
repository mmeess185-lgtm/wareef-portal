import { supabase } from "../supabaseClient";

/* =========================================================================
   TEMPORARY HARDCODED IDENTITY
   Real login isn't wired up yet, so we hardcode which row in `users` is
   "currently logged in" for each role. Once Supabase Auth is added, these
   will be replaced by the logged-in user's real id.
   Replace the placeholder values below with the actual UUIDs from your
   Supabase `users` table (Table Editor → users → copy the `id` cell).
========================================================================= */
export const CURRENT_TENANT_ID = "0e0f3c5e-1831-4840-8691-061c0dd56d7d";
export const CURRENT_TECHNICIAN_ID = "bb8c75b4-89c2-48fb-a161-4c960dfe5827";

/* ----------------------------- helpers ----------------------------- */

function genReferenceCode() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `REQ-${n}`;
}

/* ----------------------------- tenant context ----------------------------- */

// Resolves the logged-in tenant's profile + their unit/building/property.
export async function getTenantContext(tenantId = CURRENT_TENANT_ID) {
  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("id, full_name, email, phone, preferred_lang")
    .eq("id", tenantId)
    .single();
  if (userErr) throw userErr;

  const { data: tu, error: tuErr } = await supabase
    .from("tenant_units")
    .select("unit_id, move_in_date, units ( id, unit_number, floor, bedrooms, buildings ( id, name ) )")
    .eq("user_id", tenantId)
    .eq("is_primary", true)
    .maybeSingle();
  if (tuErr) throw tuErr;

  return {
    id: user.id,
    name: user.full_name,
    email: user.email,
    phone: user.phone,
    unitId: tu?.units?.id ?? null,
    unitNumber: tu?.units?.unit_number ?? "-",
    buildingName: tu?.units?.buildings?.name ?? "-",
    moveIn: tu?.move_in_date ?? null,
  };
}

/* ----------------------------- technicians ----------------------------- */

export async function fetchTechnicians() {
  const { data, error } = await supabase
    .from("technician_profiles")
    .select("user_id, specialty, rating_avg, max_daily_jobs, users ( full_name, phone )");
  if (error) throw error;
  return (data || []).map((t) => ({
    id: t.user_id,
    name: t.users?.full_name ?? "Unnamed",
    phone: t.users?.phone ?? "",
    specialty: t.specialty,
    rating: t.rating_avg,
  }));
}

/* ----------------------------- requests: list ----------------------------- */

const REQUEST_SELECT = `
  id, reference_code, category, priority, status, description, preferred_time,
  created_at, completed_at, closed_at, rating, technician_id,
  units ( unit_number, buildings ( name ) ),
  tenant:tenant_id ( full_name ),
  technician:technician_id ( full_name )
`;

function mapRequestRow(r) {
  return {
    id: r.reference_code,
    dbId: r.id,
    unit: r.units?.unit_number ?? "-",
    building: r.units?.buildings?.name ?? "-",
    tenant: r.tenant?.full_name ?? "-",
    category: r.category,
    priority: r.priority,
    status: r.status,
    description: r.description,
    preferredTime: r.preferred_time,
    createdAt: r.created_at,
    technician: r.technician_id,
    technicianName: r.technician?.full_name ?? null,
    notes: [],   // loaded lazily when a request is opened
    chat: [],    // loaded lazily when a request is opened
    photos: 0,   // attachment count loaded lazily
    rating: r.rating,
  };
}

export async function fetchAllRequests() {
  const { data, error } = await supabase
    .from("maintenance_requests")
    .select(REQUEST_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRequestRow);
}

export async function fetchRequestsForUnit(unitId) {
  const { data, error } = await supabase
    .from("maintenance_requests")
    .select(REQUEST_SELECT)
    .eq("unit_id", unitId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRequestRow);
}

export async function fetchRequestsForTechnician(technicianId) {
  const { data, error } = await supabase
    .from("maintenance_requests")
    .select(REQUEST_SELECT)
    .eq("technician_id", technicianId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRequestRow);
}

/* ----------------------------- requests: detail (notes/chat/photos) ----------------------------- */

export async function fetchRequestDetail(dbId) {
  const [{ data: notes, error: notesErr }, { data: chat, error: chatErr }, { count: photoCount, error: photoErr }] =
    await Promise.all([
      supabase
        .from("request_notes")
        .select("body, created_at, author:author_id ( full_name )")
        .eq("request_id", dbId)
        .order("created_at", { ascending: true }),
      supabase
        .from("chat_messages")
        .select("body, created_at, sender_id, sender:sender_id ( role )")
        .eq("request_id", dbId)
        .order("created_at", { ascending: true }),
      supabase
        .from("request_attachments")
        .select("id", { count: "exact", head: true })
        .eq("request_id", dbId),
    ]);
  if (notesErr) throw notesErr;
  if (chatErr) throw chatErr;
  if (photoErr) throw photoErr;

  return {
    notes: (notes || []).map((n) => ({ by: n.author?.full_name ?? "Unknown", text: n.body, at: n.created_at })),
    chat: (chat || []).map((c) => ({ from: c.sender?.role === "tenant" ? "tenant" : "coordinator", text: c.body, at: c.created_at })),
    photos: photoCount || 0,
  };
}

/* ----------------------------- requests: mutations ----------------------------- */

export async function createRequest({ unitId, tenantId, category, priority, description, preferredTime }) {
  const { data, error } = await supabase
    .from("maintenance_requests")
    .insert({
      reference_code: genReferenceCode(),
      unit_id: unitId,
      tenant_id: tenantId,
      category,
      priority,
      description,
      preferred_time: preferredTime,
      status: "new",
    })
    .select(REQUEST_SELECT)
    .single();
  if (error) throw error;
  return mapRequestRow(data);
}

export async function updateRequestStatus(dbId, newStatus, changedBy, oldStatus) {
  const { error: updErr } = await supabase
    .from("maintenance_requests")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
      ...(newStatus === "completed" ? { completed_at: new Date().toISOString() } : {}),
      ...(newStatus === "closed" ? { closed_at: new Date().toISOString() } : {}),
    })
    .eq("id", dbId);
  if (updErr) throw updErr;

  await supabase.from("request_status_history").insert({
    request_id: dbId,
    from_status: oldStatus,
    to_status: newStatus,
    changed_by: changedBy,
  });
}

export async function assignTechnician(dbId, technicianId, currentStatus) {
  const { error } = await supabase
    .from("maintenance_requests")
    .update({
      technician_id: technicianId || null,
      assigned_at: technicianId ? new Date().toISOString() : null,
      status: technicianId && currentStatus === "new" ? "assigned" : currentStatus,
    })
    .eq("id", dbId);
  if (error) throw error;
}

export async function addNote(dbId, authorId, body) {
  const { error } = await supabase.from("request_notes").insert({
    request_id: dbId,
    author_id: authorId,
    body,
  });
  if (error) throw error;
}

export async function sendChatMessage(dbId, senderId, body) {
  const { error } = await supabase.from("chat_messages").insert({
    request_id: dbId,
    sender_id: senderId,
    body,
  });
  if (error) throw error;
}

export async function submitRating(dbId, rating) {
  const { error } = await supabase.from("maintenance_requests").update({ rating }).eq("id", dbId);
  if (error) throw error;
}
