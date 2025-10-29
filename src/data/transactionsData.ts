const members = [
  "Amit Gwachha",
  "Bhusan Bhele",
  "Binod Manandhar",
  "Rajesh Sonepa",
  "Susan Duwal",
  "Bikram Tamang"
];
const types = ["Monthly Saving", "Loan", "Loan Payment", "Interest Paid"];

export const transactions = Array.from({ length: 120 }, (_, i) => {
  const member = members[Math.floor(Math.random() * members.length)];
  const type = types[Math.floor(Math.random() * types.length)];
  let amount = Math.floor(Math.random() * 90000 + 10000);;
  if (type === "Loan") amount = -amount;
  return {
    id: i + 1,
    member,
    date: `2025-10-${String((i % 30) + 1).padStart(2, "0")}`,
    type,
    amount,
  };
});
