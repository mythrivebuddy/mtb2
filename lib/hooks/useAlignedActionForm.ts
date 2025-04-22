import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  AlignedActionFormData, 
  Step1Data, 
  Step2Data, 
  Step3Data,
  defaultStep1Values,
  defaultStep2Values,
  defaultStep3Values
} from "../utils/aligned-action-form";

// Query key for the form data
const FORM_QUERY_KEY = "alignedActionForm";

export function useAlignedActionForm() {
  const queryClient = useQueryClient();

  // Get the current form data
  const { data: formData = {
    step1: defaultStep1Values,
    step2: defaultStep2Values,
    step3: defaultStep3Values
  } } = useQuery({
    queryKey: [FORM_QUERY_KEY],
    queryFn: () => {
      const currentData = queryClient.getQueryData<AlignedActionFormData>([FORM_QUERY_KEY]);
      return currentData || {
        step1: defaultStep1Values,
        step2: defaultStep2Values,
        step3: defaultStep3Values
      };
    },
    initialData: {
      step1: defaultStep1Values,
      step2: defaultStep2Values,
      step3: defaultStep3Values
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Update the step1 data
  const updateStep1 = useMutation({
    mutationFn: (newData: Step1Data) => {
      return Promise.resolve({
        ...formData,
        step1: newData
      });
    },
    onSuccess: (newFormData) => {
      queryClient.setQueryData([FORM_QUERY_KEY], newFormData);
    },
  });

  // Update the step2 data
  const updateStep2 = useMutation({
    mutationFn: (newData: Step2Data) => {
      return Promise.resolve({
        ...formData,
        step2: newData
      });
    },
    onSuccess: (newFormData) => {
      queryClient.setQueryData([FORM_QUERY_KEY], newFormData);
    },
  });

  // Update the step3 data
  const updateStep3 = useMutation({
    mutationFn: (newData: Step3Data) => {
      return Promise.resolve({
        ...formData,
        step3: newData
      });
    },
    onSuccess: (newFormData) => {
      queryClient.setQueryData([FORM_QUERY_KEY], newFormData);
    },
  });

  // Reset the entire form
  const resetForm = useMutation({
    mutationFn: () => {
      return Promise.resolve({
        step1: defaultStep1Values,
        step2: defaultStep2Values,
        step3: defaultStep3Values
      });
    },
    onSuccess: (newFormData) => {
      queryClient.setQueryData([FORM_QUERY_KEY], newFormData);
    },
  });

  return {
    formData: formData as AlignedActionFormData,
    updateStep1: (data: Step1Data) => updateStep1.mutate(data),
    updateStep2: (data: Step2Data) => updateStep2.mutate(data),
    updateStep3: (data: Step3Data) => updateStep3.mutate(data),
    resetForm: () => resetForm.mutate(),
    isLoading: updateStep1.isPending || updateStep2.isPending || updateStep3.isPending || resetForm.isPending
  };
} 