-- A participant who has not requested yet can express the same intent later.

create or replace function public.respond_to_friendship(
  p_friendship_id uuid
)
returns setof public.friendships
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_friendship public.friendships;
begin
  if v_user_id is null then
    raise exception 'Authentication is required';
  end if;

  select *
  into v_friendship
  from public.friendships
  where id = p_friendship_id
  for update;

  if not found then
    raise exception 'Friendship was not found';
  end if;

  if v_user_id <> v_friendship.user_a_id
    and v_user_id <> v_friendship.user_b_id then
    raise exception 'Only a friendship participant can respond';
  end if;

  if v_friendship.status = 'matched' then
    return next v_friendship;
    return;
  end if;

  if (
    v_user_id = v_friendship.user_a_id
    and v_friendship.user_a_requested
  ) or (
    v_user_id = v_friendship.user_b_id
    and v_friendship.user_b_requested
  ) then
    raise exception 'Friendship intent has already been sent';
  end if;

  update public.friendships
  set user_a_requested = user_a_requested or v_user_id = user_a_id,
      user_b_requested = user_b_requested or v_user_id = user_b_id,
      status = 'matched',
      updated_at = now()
  where id = p_friendship_id
  returning * into v_friendship;

  return next v_friendship;
  return;
end;
$$;

revoke execute on function public.respond_to_friendship(uuid)
from public, anon;

grant execute on function public.respond_to_friendship(uuid)
to authenticated;
