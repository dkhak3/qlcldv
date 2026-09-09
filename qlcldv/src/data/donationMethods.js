export const DONATION_METHODS = [
  { value: "bank", label: "Ngân hàng", providerLabel: "Tên ngân hàng", accountLabel: "Số tài khoản" },
  { value: "momo", label: "Ví MoMo", providerLabel: "Tên ví", accountLabel: "Số điện thoại" },
  { value: "zalopay", label: "ZaloPay", providerLabel: "Tên ví", accountLabel: "Số điện thoại" },
  { value: "viettel-money", label: "Viettel Money", providerLabel: "Tên ví", accountLabel: "Số điện thoại" },
  { value: "paypal", label: "PayPal", providerLabel: "Tên phương thức", accountLabel: "Email PayPal" },
  { value: "other", label: "Hình thức khác", providerLabel: "Tên phương thức", accountLabel: "Thông tin nhận" },
];

export const VIETNAM_BANKS = [
  "Agribank", "ACB", "BIDV", "HDBank", "MB Bank", "MSB", "OCB", "Sacombank",
  "SHB", "Techcombank", "TPBank", "VIB", "Vietcombank", "VietinBank", "VPBank",
];

export function getDonationMethod(value) {
  return DONATION_METHODS.find(item => item.value === value) || DONATION_METHODS[0];
}
