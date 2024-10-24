import { Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';


const Hint = ({children}:any) => {
    const icon = <IconInfoCircle />;
    return (
      <Alert variant="light" color="gray" title="Подсказка" icon={icon}>
        {children}
      </Alert>
    );
}

export default Hint;