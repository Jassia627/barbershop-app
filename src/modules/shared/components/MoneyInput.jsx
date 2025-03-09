// src/modules/shared/components/MoneyInput.jsx
import { NumericFormat } from 'react-number-format';

const CurrencyInput = ({ value, onValueChange, className, required = false, disabled = false }) => {
  return (
    <NumericFormat
      thousandSeparator="."
      decimalSeparator=","
      value={value}
      onValueChange={(values) => onValueChange(values.floatValue || '')}
      className={className}
      required={required}
      disabled={disabled}
      allowNegative={false}
      decimalScale={0}
    />
  );
};

export default CurrencyInput;