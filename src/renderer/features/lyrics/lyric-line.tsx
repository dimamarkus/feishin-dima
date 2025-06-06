import { TitleProps } from '@mantine/core';
import { ComponentPropsWithoutRef } from 'react';
import styled from 'styled-components';

import { TextTitle } from '/@/renderer/components/text-title';

interface LyricLineProps extends ComponentPropsWithoutRef<'div'> {
    alignment: 'center' | 'left' | 'right';
    fontSize: number;
    text: string;
}

const StyledText = styled(TextTitle)<TitleProps & { $alignment: string; $fontSize: number }>`
    padding: 0 1rem;
    font-size: ${(props) => props.$fontSize}px;
    font-weight: 600;
    color: var(--main-fg);
    text-align: ${(props) => props.$alignment};
    opacity: 0.5;

    transition:
        opacity 0.3s ease-in-out,
        transform 0.3s ease-in-out;

    &.active {
        opacity: 1;
    }

    &.unsynchronized {
        opacity: 1;
    }

    &.synchronized {
        cursor: pointer;
    }
`;

export const LyricLine = ({ alignment, fontSize, text, ...props }: LyricLineProps) => {
    return (
        <StyledText
            $alignment={alignment}
            $fontSize={fontSize}
            {...props}
        >
            {text}
        </StyledText>
    );
};
