"use client";
import { Button } from "@/components/ui/button";
import { InputWithLabel } from "@/components/inputs/InputWithLabel";
import { TextareaWithLabel } from "@/components/inputs/TextareaWithLabel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import axios from "axios";
import { toast } from "sonner";
import { getAxiosErrorMessage } from "@/utils/ax";
import { ProsperityFormType, prosperitySchema } from "@/schema/zodSchema";

const ProsperityPage = () => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProsperityFormType>({
    resolver: zodResolver(prosperitySchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: ProsperityFormType) => {
      const response = await axios.post("/api/user/prosperity", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Prosperity Drop application submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["prosperityDrops"] });
      queryClient.invalidateQueries({ queryKey: ["userInfo"] });
      reset(); // Reset form using react-hook-form
    },
    onError: (error) => {
      toast.error(getAxiosErrorMessage(error));
    },
  });

  const onSubmit: SubmitHandler<ProsperityFormType> = (data) => {
    mutation.mutate(data);
  };

  return (
    <div className="container mx-auto px-0 space-y-6">
      {/* Requirements Section */}
      <Card>
        <CardHeader>
          <CardTitle>Requirements</CardTitle>
          <CardDescription>
            Before you apply, please ensure you meet the following criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              You must have 5,000 JP tokens to apply (lower amounts for premium
              plan members)
            </li>
            <li>Your account must be at least 30 days old</li>
            <li>You must have a complete business profile</li>
            <li>You must provide valid documentation of your business needs</li>
            <li>Application does not guarantee approval</li>
          </ul>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Terms and Conditions</CardTitle>
          <CardDescription>
            Please read carefully before applying
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              By applying for a Prosperity Drop, you acknowledge and agree to
              the following:
            </p>
            <ul className="list-decimal pl-6 space-y-2">
              <li>The application fee of 5,000 JP is non-refundable</li>
              <li>All information provided must be accurate and verifiable</li>
              <li>
                MTB reserves the right to approve or reject any application
              </li>
              <li>Approved drops will be processed within 14 business days</li>
              <li>
                Misuse or fraudulent applications will result in account
                suspension
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Application Form */}
      <Card>
        <CardHeader>
          <CardTitle>Apply for Prosperity Drop</CardTitle>
          <CardDescription>
            Fill out the form below to submit your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <InputWithLabel
              label="Project Title"
              id="title"
              placeholder="Enter your project title"
              error={errors.title}
              {...register("title")}
            />

            <TextareaWithLabel
              label="Project Description"
              id="description"
              placeholder="Describe your project and how the prosperity drop will help..."
              error={errors.description}
              {...register("description")}
            />

            {/* <ConfirmAction
              action={handleSubmit(onSubmit)}
              // isDisabled={mutation.isPending || !isValid}
            > */}
              <Button
                type="submit"
                className="w-full"
                // disabled={mutation.isPending || !isValid}
              >
                {mutation.isPending
                  ? "Submitting..."
                  : "Submit Application (5,000 JP)"}
              </Button>
            {/* </ConfirmAction> */}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProsperityPage;
