import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { observer } from 'mobx-react';
import { Stakeholder, StakeholderData } from '@/services/stakeholders-service';
import customersStore from '@/stores/customers.store';
import StakeholderTable from './StakeholderTable';
import StakeholderForm from './StakeholderForm';

interface StakeholderManagementProps {
  customerId: string;
}

type ViewMode = 'list' | 'create' | 'edit';

const StakeholderManagement: React.FC<StakeholderManagementProps> = ({ customerId }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingStakeholder, setEditingStakeholder] = useState<Stakeholder | null>(null);
  const fetchedCustomerIdRef = useRef<string | null>(null);

  console.log('🔄 StakeholderManagement: Component rendered with customerId:', customerId, 'viewMode:', viewMode);

  useEffect(() => {
    if (customerId && fetchedCustomerIdRef.current !== customerId) {
      console.log('🔄 StakeholderManagement: Fetching stakeholders for customer:', customerId);
      fetchedCustomerIdRef.current = customerId;
      customersStore.fetchStakeholders(customerId);
    }
  }, [customerId]);

  const handleAddStakeholder = () => {
    console.log('🔄 StakeholderManagement: handleAddStakeholder called, setting viewMode to create');
    setEditingStakeholder(null);
    setViewMode('create');
  };

  const handleEditStakeholder = (stakeholder: Stakeholder) => {
    setEditingStakeholder(stakeholder);
    setViewMode('edit');
  };

  const handleDeleteStakeholder = async (stakeholderId: string) => {
    await customersStore.deleteStakeholder(customerId, stakeholderId);
  };

  const handleSaveStakeholder = async (data: StakeholderData) => {
    console.log('🔄 StakeholderManagement: handleSaveStakeholder called with mode:', viewMode, 'data:', data);
    if (viewMode === 'create') {
      console.log('🔄 StakeholderManagement: Creating new stakeholder');
      await customersStore.createStakeholder(customerId, data);
    } else if (viewMode === 'edit' && editingStakeholder) {
      console.log('🔄 StakeholderManagement: Updating stakeholder:', editingStakeholder._id);
      await customersStore.updateStakeholder(customerId, editingStakeholder._id, data);
    }
    setViewMode('list');
    setEditingStakeholder(null);
  };

  const handleCancel = () => {
    setViewMode('list');
    setEditingStakeholder(null);
  };


  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <StakeholderForm
        mode={viewMode}
        customerId={customerId}
        stakeholderId={editingStakeholder?._id}
        initialData={editingStakeholder || undefined}
        onSave={handleSaveStakeholder}
        onCancel={handleCancel}
        isLoading={customersStore.isSaving}
      />
    );
  }

  return (
    <Box>
      <StakeholderTable
        stakeholders={(customersStore.currentCustomer?.stakeholders || []) as Stakeholder[]}
        isLoading={customersStore.isLoading}
        error={customersStore.error}
        customerId={customerId}
        onEdit={handleEditStakeholder}
        onDelete={handleDeleteStakeholder}
        onAdd={handleAddStakeholder}
      />
    </Box>
  );
};

export default observer(StakeholderManagement);
