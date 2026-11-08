const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateLogin = ({ username, password }) => {
  const errors = {};
  if (!username?.trim()) errors.username = "Username is required";
  if (!password) errors.password = "Password is required";
  return errors;
};

export const validateRegister = ({ username, email, password, confirmPassword }) => {
  const errors = {};
  const name = username?.trim() ?? "";
  if (name.length < 3 || name.length > 20) errors.username = "Username must be 3 to 20 characters";
  if (!EMAIL_PATTERN.test(email?.trim() ?? "")) errors.email = "Enter a valid email address";
  if (!password || password.length < 8 || password.length > 40) {
    errors.password = "Password must be 8 to 40 characters";
  }
  if (confirmPassword !== password) errors.confirmPassword = "Passwords do not match";
  return errors;
};

export const validateAddress = ({ street, buildingName, city, state, country, pincode }) => {
  const errors = {};
  const check = (key, value, min, max, label) => {
    const text = value?.trim() ?? "";
    if (text.length < min || text.length > max) errors[key] = `${label} must be ${min} to ${max} characters`;
  };
  check("street", street, 3, 120, "Street");
  check("buildingName", buildingName, 2, 120, "Building name");
  check("city", city, 2, 80, "City");
  check("state", state, 2, 80, "State");
  check("country", country, 2, 80, "Country");
  check("pincode", pincode, 4, 10, "Pincode");
  return errors;
};

export const validateProfile = ({ email, currentPassword, newPassword, confirmPassword }) => {
  const errors = {};
  if (!EMAIL_PATTERN.test(email?.trim() ?? "")) errors.email = "Enter a valid email address";
  if (newPassword || currentPassword || confirmPassword) {
    if (!currentPassword) errors.currentPassword = "Enter your current password";
    if (!newPassword || newPassword.length < 8 || newPassword.length > 40) {
      errors.newPassword = "New password must be 8 to 40 characters";
    }
    if (confirmPassword !== newPassword) errors.confirmPassword = "Passwords do not match";
  }
  return errors;
};

export const validateProduct = ({ productName, description, price, discount, quantity }) => {
  const errors = {};
  const name = productName?.trim() ?? "";
  const desc = description?.trim() ?? "";
  if (name.length < 3 || name.length > 120) errors.productName = "Name must be 3 to 120 characters";
  if (desc.length < 6 || desc.length > 255) errors.description = "Description must be 6 to 255 characters";
  if (!(Number(price) > 0)) errors.price = "Price must be greater than 0";
  if (discount === "" || Number(discount) < 0 || Number(discount) > 100) {
    errors.discount = "Discount must be between 0 and 100";
  }
  if (quantity === "" || !Number.isInteger(Number(quantity)) || Number(quantity) < 0) {
    errors.quantity = "Stock must be a whole number, 0 or more";
  }
  return errors;
};

export const hasErrors = (errors) => Object.keys(errors).length > 0;
