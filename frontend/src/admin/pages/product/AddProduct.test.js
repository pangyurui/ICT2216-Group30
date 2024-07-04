import { fireEvent, render } from '@testing-library/react';
import AddProduct from './AddProduct';

test('input sanitization', () => {
  const { getByLabelText, getByText } = render(<AddProduct />);
  const input = getByLabelText('Description:');
  fireEvent.change(input, { target: { value: '<script>alert("XSS")</script>' } });
  fireEvent.submit(getByText('Submit'));

  // Assert that the sanitized value does not contain harmful scripts
  expect(input.value).toBe(''); // Modify this line based on your actual sanitization logic
});
