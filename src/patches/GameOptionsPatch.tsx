import {
  afterPatch,
  fakeRenderComponent,
  findInReactTree,
  findInTree,
  MenuItem,
  Navigation,
} from 'decky-frontend-lib';
import { PyInterop } from "../lib/controllers/PyInterop";

// Always add before "Properties...". Maintains compatibility with decky-sgdb.
export function insertAchievementEditor(children: any[], appid: number) {
  children.find((x: any) => x?.key === 'properties');
  const propertiesMenuItemIdx = children.findIndex((item) =>
    findInReactTree(item, (x) => x?.onSelected && x.onSelected.toString().includes('AppProperties'))
  );
  children.splice(propertiesMenuItemIdx, 0, (
    <MenuItem
      key="decky-sam-edit"
      onSelected={() => {
        Navigation.Navigate(`/steamgriddb/${appid}`);
      }}
    >
      Edit Achievements
    </MenuItem>
  ));
};

export function libContextMenuPatch(LibraryContextMenu: any) {
  return afterPatch(LibraryContextMenu.prototype, 'render', (_: Record<string, unknown>[], component: any) => {
    PyInterop.log(component);
    const appid: number = component._owner.pendingProps.overview.appid;

    afterPatch(component.type.prototype, 'shouldComponentUpdate', ([nextProps]: any, shouldUpdate: any) => {
      if (shouldUpdate === true && !nextProps.children.find((x: any) => x?.key === 'sgdb-change-artwork')) {
        let updatedAppid: number = appid;
        // find the first menu component that has the correct appid assigned to _owner
        const parentOverview = nextProps.children.find((x: any) => x?._owner?.pendingProps?.overview?.appid &&
          x._owner.pendingProps.overview.appid !== appid
        );
        // if found then use that appid
        if (parentOverview) {
          updatedAppid = parentOverview._owner.pendingProps.overview.appid;
        }
        insertAchievementEditor(nextProps.children, updatedAppid);
      }
      return shouldUpdate;
    }, { singleShot: true });

    insertAchievementEditor(component.props.children, appid);
    return component;
  });
};

export async function getLibContextMenu() {
  // @ts-ignore: decky global is not typed
  while (!window.DeckyPluginLoader?.routerHook?.routes) {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  let LibraryContextMenu = findInReactTree(
    fakeRenderComponent(
      findInTree(
        fakeRenderComponent(
          // @ts-ignore: decky global is not typed
          window.DeckyPluginLoader.routerHook.routes.find((x) => x?.props?.path == '/zoo').props.children.type
        ), (x) => x?.route === '/zoo/modals',
        {
          walkable: ['props', 'children', 'child', 'pages'],
        }
      ).content.type
    ),
    (x) => x?.title?.includes('AppActionsMenu')
  ).children.type;

  if (!LibraryContextMenu?.prototype?.AddToHidden) {
    LibraryContextMenu = fakeRenderComponent(LibraryContextMenu).type;
  }
  return LibraryContextMenu;
};
