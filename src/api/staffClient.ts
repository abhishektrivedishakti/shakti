import type { StaffRole, StaffUser } from '../types';
import { apiJson } from './http';

export async function fetchStaffList(): Promise<StaffUser[]> {
  const data = await apiJson<{ success: true; staff: StaffUser[] }>('/api/staff');
  return data.staff;
}

export async function fetchStaffById(id: string): Promise<StaffUser> {
  const data = await apiJson<{ success: true; staff: StaffUser }>(`/api/staff/${id}`);
  return data.staff;
}

export async function createStaffApi(payload: {
  name: string;
  mobile: string;
  email?: string;
  designation?: string;
  role: StaffRole;
  pin?: string;
  password?: string;
  avatarColor?: string;
  permissions?: StaffUser['permissions'];
}): Promise<StaffUser> {
  const data = await apiJson<{ success: true; staff: StaffUser }>('/api/staff', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.staff;
}

export async function updateStaffApi(
  id: string,
  payload: Partial<{
    name: string;
    mobile: string;
    email: string;
    designation: string;
    role: StaffRole;
    avatarColor: string;
    permissions: StaffUser['permissions'];
  }>
): Promise<StaffUser> {
  const data = await apiJson<{ success: true; staff: StaffUser }>(`/api/staff/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data.staff;
}

export async function updateStaffPermissionsApi(
  id: string,
  permissions: StaffUser['permissions']
): Promise<StaffUser> {
  const data = await apiJson<{ success: true; staff: StaffUser }>(`/api/staff/${id}/permissions`, {
    method: 'PATCH',
    body: JSON.stringify({ permissions }),
  });
  return data.staff;
}

export async function setStaffStatusApi(id: string, status: 'active' | 'inactive'): Promise<StaffUser> {
  const data = await apiJson<{ success: true; staff: StaffUser }>(`/api/staff/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return data.staff;
}

export async function resetStaffPasswordApi(
  id: string,
  secret: { password?: string; pin?: string }
): Promise<void> {
  await apiJson<{ success: true }>(`/api/staff/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify(secret),
  });
}

export async function deactivateStaffApi(id: string): Promise<StaffUser> {
  const data = await apiJson<{ success: true; staff: StaffUser }>(`/api/staff/${id}`, {
    method: 'DELETE',
  });
  return data.staff;
}

export async function fetchRoleTemplates(): Promise<
  Array<{ role: StaffRole; label: string; description: string; permissions: StaffUser['permissions'] }>
> {
  const data = await apiJson<{
    success: true;
    templates: Array<{
      role: StaffRole;
      label: string;
      description: string;
      permissions: StaffUser['permissions'];
    }>;
  }>('/api/staff/roles/templates');
  return data.templates;
}
