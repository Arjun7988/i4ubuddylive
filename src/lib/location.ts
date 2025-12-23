export function getActivePincode() {
  return (
    localStorage.getItem('active_pincode') ||
    localStorage.getItem('user_pincode') ||
    null
  );
}
