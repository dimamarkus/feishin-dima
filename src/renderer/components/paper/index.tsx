import type { PaperProps as MantinePaperProps } from '@mantine/core';

import { Paper as MantinePaper } from '@mantine/core';
import { ReactNode } from 'react';
import styled from 'styled-components';

export interface PaperProps extends MantinePaperProps {
    children: ReactNode;
}

const StyledPaper = styled(MantinePaper)<PaperProps>`
    background: var(--paper-bg);
`;

export const Paper = ({ children, ...props }: PaperProps) => {
    return <StyledPaper {...props}>{children}</StyledPaper>;
};
