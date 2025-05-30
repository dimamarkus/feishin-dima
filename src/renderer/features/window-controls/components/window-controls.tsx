import isElectron from 'is-electron';
import { useState } from 'react';
import { RiCheckboxBlankLine, RiCloseLine, RiSubtractLine } from 'react-icons/ri';
import styled from 'styled-components';

const browser = isElectron() ? window.api.browser : null;

interface WindowControlsProps {
    style?: 'linux' | 'macos' | 'windows';
}

const WindowsButtonGroup = styled.div`
    display: flex;
    width: 130px;
    height: 100%;
    -webkit-app-region: no-drag;
`;

export const WindowsButton = styled.div<{ $exit?: boolean }>`
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    -webkit-app-region: no-drag;
    width: 50px;
    height: 65px;

    img {
        width: 35%;
        height: 50%;
    }

    &:hover {
        background: ${({ $exit }) => ($exit ? 'var(--danger-color)' : 'rgba(125, 125, 125, 30%)')};
    }
`;

const close = () => browser?.exit();

const minimize = () => browser?.minimize();

const maximize = () => browser?.maximize();

const unmaximize = () => browser?.unmaximize();

export const WindowControls = ({ style }: WindowControlsProps) => {
    const [max, setMax] = useState(false);

    const handleMinimize = () => minimize();

    const handleMaximize = () => {
        if (max) {
            unmaximize();
        } else {
            maximize();
        }
        setMax(!max);
    };

    const handleClose = () => close();

    return (
        <>
            {isElectron() && (
                <>
                    {style === 'windows' && (
                        <WindowsButtonGroup>
                            <WindowsButton
                                onClick={handleMinimize}
                                role="button"
                            >
                                <RiSubtractLine size={19} />
                            </WindowsButton>
                            <WindowsButton
                                onClick={handleMaximize}
                                role="button"
                            >
                                <RiCheckboxBlankLine size={13} />
                            </WindowsButton>
                            <WindowsButton
                                $exit
                                onClick={handleClose}
                                role="button"
                            >
                                <RiCloseLine size={19} />
                            </WindowsButton>
                        </WindowsButtonGroup>
                    )}
                </>
            )}
        </>
    );
};
