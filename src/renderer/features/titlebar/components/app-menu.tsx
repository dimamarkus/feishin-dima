import { Group } from '@mantine/core';
import { closeAllModals, openModal } from '@mantine/modals';
import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';
import {
    RiArrowLeftSLine,
    RiArrowRightSLine,
    RiCloseCircleLine,
    RiEdit2Line,
    RiExternalLinkLine,
    RiGithubLine,
    RiLayoutLeftLine,
    RiLayoutRightLine,
    RiLockLine,
    RiServerLine,
    RiSettings3Line,
    RiWindowFill,
} from 'react-icons/ri';
import { useNavigate } from 'react-router';
import { Link } from 'react-router-dom';

import packageJson from '../../../../../package.json';

import { DropdownMenu } from '/@/renderer/components';
import { ServerList } from '/@/renderer/features/servers';
import { EditServerForm } from '/@/renderer/features/servers/components/edit-server-form';
import { AppRoute } from '/@/renderer/router/routes';
import {
    useAppStoreActions,
    useAuthStoreActions,
    useCurrentServer,
    useServerList,
    useSidebarStore,
} from '/@/renderer/store';
import { ServerListItem, ServerType } from '/@/shared/types/domain-types';

const browser = isElectron() ? window.api.browser : null;
const localSettings = isElectron() ? window.api.localSettings : null;

export const AppMenu = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const currentServer = useCurrentServer();
    const serverList = useServerList();
    const { setCurrentServer } = useAuthStoreActions();
    const { collapsed } = useSidebarStore();
    const { setSideBar } = useAppStoreActions();

    const handleSetCurrentServer = (server: ServerListItem) => {
        navigate(AppRoute.HOME);
        setCurrentServer(server);
    };

    const handleCredentialsModal = async (server: ServerListItem) => {
        let password: null | string = null;

        try {
            if (localSettings && server.savePassword) {
                password = await localSettings.passwordGet(server.id);
            }
        } catch (error) {
            console.error(error);
        }
        openModal({
            children: server && (
                <EditServerForm
                    isUpdate
                    onCancel={closeAllModals}
                    password={password}
                    server={server}
                />
            ),
            size: 'sm',
            title: `Update session for "${server.name}"`,
        });
    };

    const handleManageServersModal = () => {
        openModal({
            children: <ServerList />,
            title: t('page.manageServers.title', { postProcess: 'titleCase' }),
        });
    };

    const handleBrowserDevTools = () => {
        browser?.devtools();
    };

    const handleCollapseSidebar = () => {
        setSideBar({ collapsed: true });
    };

    const handleExpandSidebar = () => {
        setSideBar({ collapsed: false });
    };

    const handleQuit = () => {
        browser?.quit();
    };

    return (
        <>
            <DropdownMenu.Item
                icon={<RiArrowLeftSLine />}
                onClick={() => navigate(-1)}
            >
                {t('page.appMenu.goBack', { postProcess: 'sentenceCase' })}
            </DropdownMenu.Item>
            <DropdownMenu.Item
                icon={<RiArrowRightSLine />}
                onClick={() => navigate(1)}
            >
                {t('page.appMenu.goForward', { postProcess: 'sentenceCase' })}
            </DropdownMenu.Item>
            {collapsed ? (
                <DropdownMenu.Item
                    icon={<RiLayoutRightLine />}
                    onClick={handleExpandSidebar}
                >
                    {t('page.appMenu.expandSidebar', { postProcess: 'sentenceCase' })}
                </DropdownMenu.Item>
            ) : (
                <DropdownMenu.Item
                    icon={<RiLayoutLeftLine />}
                    onClick={handleCollapseSidebar}
                >
                    {t('page.appMenu.collapseSidebar', { postProcess: 'sentenceCase' })}
                </DropdownMenu.Item>
            )}
            <DropdownMenu.Divider />
            <DropdownMenu.Item
                component={Link}
                icon={<RiSettings3Line />}
                to={AppRoute.SETTINGS}
            >
                {t('page.appMenu.settings', { postProcess: 'sentenceCase' })}
            </DropdownMenu.Item>
            <DropdownMenu.Item
                icon={<RiEdit2Line />}
                onClick={handleManageServersModal}
            >
                {t('page.appMenu.manageServers', { postProcess: 'sentenceCase' })}
            </DropdownMenu.Item>

            <DropdownMenu.Divider />
            <DropdownMenu.Label>
                {t('page.appMenu.selectServer', { postProcess: 'sentenceCase' })}
            </DropdownMenu.Label>
            {Object.keys(serverList).map((serverId) => {
                const server = serverList[serverId];
                const isNavidromeExpired =
                    server.type === ServerType.NAVIDROME && !server.ndCredential;
                const isJellyfinExpired = server.type === ServerType.JELLYFIN && !server.credential;
                const isSessionExpired = isNavidromeExpired || isJellyfinExpired;

                return (
                    <DropdownMenu.Item
                        $isActive={server.id === currentServer?.id}
                        icon={
                            isSessionExpired ? (
                                <RiLockLine color="var(--danger-color)" />
                            ) : (
                                <RiServerLine />
                            )
                        }
                        key={`server-${server.id}`}
                        onClick={() => {
                            if (!isSessionExpired) return handleSetCurrentServer(server);
                            return handleCredentialsModal(server);
                        }}
                    >
                        <Group>{server.name}</Group>
                    </DropdownMenu.Item>
                );
            })}
            <DropdownMenu.Divider />
            <DropdownMenu.Item
                component="a"
                href="https://github.com/jeffvli/feishin/releases"
                icon={<RiGithubLine />}
                rightSection={<RiExternalLinkLine />}
                target="_blank"
            >
                {t('page.appMenu.version', {
                    postProcess: 'sentenceCase',
                    version: packageJson.version,
                })}
            </DropdownMenu.Item>
            {isElectron() && (
                <>
                    <DropdownMenu.Divider />
                    <DropdownMenu.Item
                        icon={<RiWindowFill />}
                        onClick={handleBrowserDevTools}
                    >
                        {t('page.appMenu.openBrowserDevtools', { postProcess: 'sentenceCase' })}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                        icon={<RiCloseCircleLine />}
                        onClick={handleQuit}
                    >
                        {t('page.appMenu.quit', { postProcess: 'sentenceCase' })}
                    </DropdownMenu.Item>
                </>
            )}
        </>
    );
};
