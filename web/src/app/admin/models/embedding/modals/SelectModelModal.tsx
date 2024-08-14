import React from "react";
import { Modal } from "@/components/Modal";
import { Button, Text, Callout } from "@tremor/react";
import { CloudEmbeddingModel } from "../components/types";

export function SelectModelModal({
  model,
  onConfirm,
  onCancel,
}: {
  model: CloudEmbeddingModel;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      onOutsideClick={onCancel}
      title={`Update model to ${model.model_name}`}
    >
      <div className="mb-4">
        <Text className="text-lg mb-2">
          You&apos;re about to set your embedding model to {model.model_name}.
          <br />
          Are you sure?
        </Text>
        <div className="flex mt-8 justify-end">
          <Button color="green" onClick={onConfirm}>
            Continue
          </Button>
        </div>
      </div>
    </Modal>
  );
}
