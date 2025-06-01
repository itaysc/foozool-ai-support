import { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box } from "@mui/material";
import { useForm } from "react-hook-form";
import { useSnackbar } from 'notistack';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

// Validation Schema
const schema = yup.object().shape({
  name: yup.string().required("Item name is required"),
  quantity: yup
    .number()
    .typeError("Quantity must be a number")
    .positive("Quantity must be greater than zero")
    .integer("Quantity must be a whole number")
    .required("Quantity is required"),
  price: yup
    .number()
    .typeError("Price must be a number")
    .required("Price is required"),
});

export default function AddInvoiceItemDialog({ open, onClose, onSave }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      quantity: 0,
      price: 0
    },
  });
  const [addMore, setAddMore] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  // Reset form when closing
  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const onSubmit = (data) => {
    onSave(data);
    reset();
    if (!addMore) {
      onClose();
    }
    enqueueSnackbar("Item added successfully", {
      variant: "success",
      autoHideDuration: 3000,
      anchorOrigin: {
        vertical: "top",
        horizontal: "center",
      },
    });
  };

  const onFocus = (e) => e.target.select();
  
  const toggleAddMore = () => {
    setAddMore(!addMore);
  };

  return (
    <Dialog open={open} onClose={(_, reason) => reason !== "backdropClick" && onClose()} fullWidth>
      <DialogTitle>Add Invoice Item</DialogTitle>
      <DialogContent>
        <TextField
          size="small"
          label="Item Name"
          fullWidth
          margin="normal"
          {...register("name")}
          error={!!errors.name}
          onFocus={onFocus}
          helperText={errors.name?.message}
          FormHelperTextProps={{
            sx: { fontSize: "0.75rem" }, // Adjust font size here
          }}
        />
        <Box display="flex" flexWrap="wrap" gap={2}>
            <Box flex="1 1 48%">
                <TextField
                    size="small"
                    label="Quantity"
                    type="number"
                    fullWidth
                    margin="normal"
                {...register("quantity")}
                error={!!errors.quantity}
                onFocus={onFocus}
                helperText={errors.quantity?.message}
                FormHelperTextProps={{
                    sx: { fontSize: "0.75rem" }, // Adjust font size here
                }}
            />
            </Box>
            <Box flex="1 1 48%">
                <TextField
                    size="small"
                    label="Price"
                    type="number"
                    fullWidth
                    margin="normal"
                    {...register("price")}
                    error={!!errors.price}
                    onFocus={onFocus}
                    helperText={errors.price?.message}
                    FormHelperTextProps={{
                        sx: { fontSize: "0.75rem" }, // Adjust font size here
                    }}
                />
            </Box>
            <FormControlLabel control={<Checkbox defaultChecked={false} value={addMore} onChange={toggleAddMore} />} label="Add more" />
        </Box>

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Close
        </Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained">
          Add Item
        </Button>
      </DialogActions>
    </Dialog>
  );
}
