import { useRecoilValue } from 'recoil';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGetStartupConfig, useUpdateUserMutation } from 'librechat-data-provider/react-query';
import { FileSources, LocalStorageKeys, getConfigDefaults } from 'librechat-data-provider';
import type { ExtendedFile } from '~/common';
import { useAuthContext, useDragHelpers, useSetFilesToDelete } from '~/hooks';
import DragDropOverlay from './Input/Files/DragDropOverlay';
import { useDeleteFilesMutation } from '~/data-provider';
import Artifacts from '~/components/Artifacts/Artifacts';
import { SidePanel } from '~/components/SidePanel';
import store from '~/store';
import * as AlertDialog from '~/components/ui/AlertDialog';

import useToast from '../../hooks/useToast';

const defaultInterface = getConfigDefaults().interface;

export default function Presentation({
  children,
  useSidePanel = false,
  panel,
}: {
  children: React.ReactNode;
  panel?: React.ReactNode;
  useSidePanel?: boolean;
}) {
  const { data: startupConfig } = useGetStartupConfig();
  const { user, isAuthenticated, logout } = useAuthContext();
  const artifacts = useRecoilValue(store.artifactsState);
  const codeArtifacts = useRecoilValue(store.codeArtifacts);
  const hideSidePanel = useRecoilValue(store.hideSidePanel);
  const artifactsVisible = useRecoilValue(store.artifactsVisible);
  const updateUser = useUpdateUserMutation();
  const { showToast } = useToast();

  const interfaceConfig = useMemo(
    () => startupConfig?.interface ?? defaultInterface,
    [startupConfig],
  );

  const setFilesToDelete = useSetFilesToDelete();
  const { isOver, canDrop, drop } = useDragHelpers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { mutateAsync } = useDeleteFilesMutation({
    onSuccess: () => {
      console.log('Temporary Files deleted');
      setFilesToDelete({});
    },
    onError: (error) => {
      console.log('Error deleting temporary files:', error);
    },
  });

  useEffect(() => {
    console.log(user);
    if (user != undefined && !user.completedLearning) {
      setIsDialogOpen(true);
      console.log('sus');
    }

    const filesToDelete = localStorage.getItem(LocalStorageKeys.FILES_TO_DELETE);
    const map = JSON.parse(filesToDelete ?? '{}') as Record<string, ExtendedFile>;
    const files = Object.values(map)
      .filter(
        (file) =>
          file.filepath != null && file.source && !(file.embedded ?? false) && file.temp_file_id,
      )
      .map((file) => ({
        file_id: file.file_id,
        filepath: file.filepath as string,
        source: file.source as FileSources,
        embedded: !!(file.embedded ?? false),
      }));

    if (files.length === 0) {
      return;
    }
    mutateAsync({ files });
  }, [mutateAsync]);

  function setLearning(completed: boolean) {
    if (user == undefined) {
      return;
    }
    updateUser.mutate({ ...user, completedLearning: completed });
  }

  const denyLearning = useCallback(function denyLearning() {
    setLearning(true);
    setIsDialogOpen(false);
    showToast({ message: 'Найти обучение всегда можно в разделе аккаунта' });
  }, []);

  const acceptLearning = useCallback(function acceptLearning() {
    setLearning(true);
    setIsDialogOpen(false);
    window.open('https://study.brusnika.ru/catalog/content/info/5845', '_blank');
  }, []);

  const isActive = canDrop && isOver;

  const defaultLayout = useMemo(() => {
    const resizableLayout = localStorage.getItem('react-resizable-panels:layout');
    return typeof resizableLayout === 'string' ? JSON.parse(resizableLayout) : undefined;
  }, []);
  const defaultCollapsed = useMemo(() => {
    const collapsedPanels = localStorage.getItem('react-resizable-panels:collapsed');
    return typeof collapsedPanels === 'string' ? JSON.parse(collapsedPanels) : true;
  }, []);
  const fullCollapse = useMemo(() => localStorage.getItem('fullPanelCollapse') === 'true', []);

  const layout = () => (
    <div className="transition-width relative flex h-full w-full flex-1 flex-col items-stretch overflow-hidden bg-white pt-0 dark:bg-gray-800">
      <div className="flex h-full flex-col" role="presentation">
        <AlertDialog.AlertDialog open={isDialogOpen}>
          <AlertDialog.AlertDialogContent>
            <AlertDialog.AlertDialogHeader>
              <AlertDialog.AlertDialogTitle>
                Добро пожаловать в корпоративный GPT Брусники!
              </AlertDialog.AlertDialogTitle>
              <img
                className=""
                src="/assets/greeting.png"
                alt="Landscape photograph by Tobias Tullius"
              />
              <AlertDialog.AlertDialogDescription>
                Чтобы быстрее освоиться в интерфейсе и открыть все возможности сервиса мы запустили
                обучающий курс.
              </AlertDialog.AlertDialogDescription>
            </AlertDialog.AlertDialogHeader>
            <AlertDialog.AlertDialogFooter>
              <AlertDialog.AlertDialogCancel onClick={() => setIsDialogOpen(false)}>
                Позже
              </AlertDialog.AlertDialogCancel>
              <AlertDialog.AlertDialogAction onClick={denyLearning}>
                Закрыть
              </AlertDialog.AlertDialogAction>
              <AlertDialog.AlertDialogAction onClick={acceptLearning} className="bg-green-400">
                Начать обучение
              </AlertDialog.AlertDialogAction>
            </AlertDialog.AlertDialogFooter>
          </AlertDialog.AlertDialogContent>
        </AlertDialog.AlertDialog>
        {children}
        {isActive && <DragDropOverlay />}
      </div>
    </div>
  );

  if (useSidePanel && !hideSidePanel && interfaceConfig.sidePanel === true) {
    return (
      <div
        ref={drop}
        className="relative flex w-full grow overflow-hidden bg-white dark:bg-gray-800"
      >
        <SidePanel
          defaultLayout={defaultLayout}
          defaultCollapsed={defaultCollapsed}
          fullPanelCollapse={fullCollapse}
          artifacts={
            artifactsVisible === true &&
            codeArtifacts === true &&
            Object.keys(artifacts ?? {}).length > 0 ? (
                <Artifacts />
              ) : null
          }
        >
          <AlertDialog.AlertDialog open={isDialogOpen}>
            <AlertDialog.AlertDialogContent>
              <AlertDialog.AlertDialogHeader>
                <AlertDialog.AlertDialogTitle>
                  Добро пожаловать в корпоративный GPT Брусники!
                </AlertDialog.AlertDialogTitle>
                <img
                  className=""
                  src="/assets/greeting.png"
                  alt="Landscape photograph by Tobias Tullius"
                />
                <AlertDialog.AlertDialogDescription>
                  Чтобы быстрее освоиться в интерфейсе и открыть все возможности сервиса мы
                  запустили обучающий курс.
                </AlertDialog.AlertDialogDescription>
              </AlertDialog.AlertDialogHeader>
              <AlertDialog.AlertDialogFooter>
                <AlertDialog.AlertDialogCancel onClick={() => setIsDialogOpen(false)}>
                  Позже
                </AlertDialog.AlertDialogCancel>
                <AlertDialog.AlertDialogAction onClick={denyLearning}>
                  Закрыть
                </AlertDialog.AlertDialogAction>
                <AlertDialog.AlertDialogAction onClick={acceptLearning} className="bg-green-400">
                  Начать обучение
                </AlertDialog.AlertDialogAction>
              </AlertDialog.AlertDialogFooter>
            </AlertDialog.AlertDialogContent>
          </AlertDialog.AlertDialog>
          <main className="flex h-full flex-col" role="main">
            {children}
            {isActive && <DragDropOverlay />}
          </main>
        </SidePanel>
      </div>
    );
  }

  return (
    <div ref={drop} className="relative flex w-full grow overflow-hidden bg-white dark:bg-gray-800">
      {layout()}
      {panel != null && panel}
    </div>
  );
}
