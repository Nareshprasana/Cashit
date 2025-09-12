// /app/(non dashboard)/add-customer/components/ProgressBar.jsx
import { motion } from "framer-motion";

const getProgressWidth = (step) => {
  switch (step) {
    case 1:
      return "2%";
    case 2:
      return "66%";
    case 3:
    default:
      return "100%";
  }
};

const getProgressColor = (step) => {
  switch (step) {
    case 1:
      return "bg-gradient-to-r from-blue-400 to-blue-600";
    case 2:
      return "bg-gradient-to-r from-yellow-400 to-yellow-600";
    case 3:
    default:
      return "bg-gradient-to-r from-green-400 to-green-600";
  }
};

const ProgressBar = ({ step }) => (
  <motion.div
    layout
    className="w-full bg-gray-300 rounded-full h-3 shadow-inner"
  >
    <motion.div
      className={`h-3 rounded-full shadow-md ${getProgressColor(step)}`}
      animate={{ width: getProgressWidth(step) }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    />
  </motion.div>
);

export default ProgressBar;
