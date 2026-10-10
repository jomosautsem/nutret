import React from 'react';
import { UnifiedLoginView } from './UnifiedLoginView';

interface NutritionistLoginViewProps {
  onGoToPatientPortal?: () => void;
  onSuccess?: () => void;
}

export const NutritionistLoginView: React.FC<NutritionistLoginViewProps> = ({ onSuccess }) => {
  return <UnifiedLoginView onSuccess={onSuccess} />;
};

export default NutritionistLoginView;
