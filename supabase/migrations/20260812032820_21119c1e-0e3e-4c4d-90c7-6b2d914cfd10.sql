delete from public.sessions where token_hash = 'f084dce12be62dc6366436340ab815ced929ae7317de7a3414633ee245179e59';
delete from public.invites where token_hash in (
  '3f28e6f2b7b6d1c0000000000000000000000000000000000000000000000000'
);
delete from public.invites where used_at is null and created_at > now() - interval '10 minutes';