import { RolesActionModal } from "./roles-action-modal";
import { useDeleteRole, useModules, useRole, useRoles } from "@/hooks/use-roles";
import { DialogEnum } from "@/models/alert-model";
import { DeleteRoleAlert } from "./delete-role-alert";
import { useRolesStore } from "@/stores/roles-store";

export function RolesModals() {
  const { openRole, setOpenRole, currentRoleId, setCurrentRoleId } = useRolesStore();
  const { data: role, isLoading, isError, error } = useRole(currentRoleId);
  const { data: modules } = useModules();
  const { data: roles } = useRoles();

  const deleteRoleMutation = useDeleteRole();

  const handleCloseModal = () => {
    setOpenRole(null);
    setCurrentRoleId(null);
  };

  const handleDeleteWithReassignment = (newRoleId?: number) => {
    if (!role) return;

    deleteRoleMutation.mutate(
      { id: role.role_id, newRoleId },
      {
        onSuccess: () => {
          handleCloseModal();
        },
      }
    );
  };

const isDeleting = deleteRoleMutation.isPending;
  return (
    <>
      <RolesActionModal
        open={openRole === DialogEnum.ADD}
        onClose={() => handleCloseModal()}
        mode={DialogEnum.ADD}
        modules={modules || []}
      />

      {role && (
        <>
          <RolesActionModal
            open={openRole === DialogEnum.VIEW || openRole === DialogEnum.EDIT}
            onClose={() => handleCloseModal()}
            switchToEdit={() => setOpenRole(DialogEnum.EDIT)}
            mode={openRole as DialogEnum.VIEW | DialogEnum.EDIT}
            role={role}
            modules={modules || []}
          />

          <DeleteRoleAlert
            open={openRole === DialogEnum.DELETE}
            onClose={handleCloseModal}
            roleToDelete={role}
            availableRoles={roles || []}
            onConfirm={handleDeleteWithReassignment}
            isLoading={isDeleting}
          />
        </>
      )}
    </>
  );
}