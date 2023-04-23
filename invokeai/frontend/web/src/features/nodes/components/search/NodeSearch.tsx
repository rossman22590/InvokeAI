import { Box, Flex } from '@chakra-ui/layout';
import { RootState } from 'app/store';
import { useAppDispatch, useAppSelector } from 'app/storeHooks';
import IAIInput from 'common/components/IAIInput';
import { Panel } from 'reactflow';
import { map } from 'lodash';
import {
  FocusEvent,
  KeyboardEvent,
  memo,
  ReactNode,
  useCallback,
  useRef,
  useState,
} from 'react';
import { Tooltip } from '@chakra-ui/tooltip';
import { AnyInvocationType } from 'services/events/types';
import { useBuildInvocation } from 'features/nodes/hooks/useBuildInvocation';
import { makeToast } from 'features/system/hooks/useToastWatcher';
import { addToast } from 'features/system/store/systemSlice';
import { nodeAdded } from '../../store/nodesSlice';

interface NodeListItemProps {
  title: string;
  description: string;
  type: AnyInvocationType;
  isSelected: boolean;
  addNode: (nodeType: AnyInvocationType) => void;
}

const NodeListItem = (props: NodeListItemProps) => {
  const { title, description, type, isSelected, addNode } = props;
  return (
    <Tooltip label={description} placement="end" hasArrow>
      <Box
        px={4}
        onClick={() => addNode(type)}
        background={isSelected ? 'base.600' : 'none'}
        _hover={{
          background: 'base.600',
          cursor: 'pointer',
        }}
      >
        {title}
      </Box>
    </Tooltip>
  );
};

NodeListItem.displayName = 'NodeListItem';

const NodeSearch = () => {
  const invocationTemplates = useAppSelector(
    (state: RootState) => state.nodes.invocationTemplates
  );

  const nodes = map(invocationTemplates);

  const buildInvocation = useBuildInvocation();
  const dispatch = useAppDispatch();

  const [searchText, setSearchText] = useState<string>('');
  const [showNodeList, setShowNodeList] = useState<boolean>(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const nodeSearchRef = useRef<HTMLDivElement>(null);

  const addNode = useCallback(
    (nodeType: AnyInvocationType) => {
      const invocation = buildInvocation(nodeType);

      if (!invocation) {
        const toast = makeToast({
          status: 'error',
          title: `Unknown Invocation type ${nodeType}`,
        });
        dispatch(addToast(toast));
        return;
      }

      dispatch(nodeAdded(invocation));
    },
    [dispatch, buildInvocation]
  );

  const renderNodeList = () => {
    const nodeListToRender: ReactNode[] = [];

    nodes.forEach(({ title, description, type }, index) => {
      if (title.toLowerCase().includes(searchText)) {
        nodeListToRender.push(
          <NodeListItem
            key={index}
            title={title}
            description={description}
            type={type}
            isSelected={focusedIndex === index}
            addNode={addNode}
          />
        );
      } else {
        <NodeListItem
          key={index}
          title={title}
          description={description}
          type={type}
          isSelected={focusedIndex === index}
          addNode={addNode}
        />;
      }
    });

    return (
      <Flex
        flexDirection="column"
        background="base.900"
        borderRadius={6}
        maxHeight={400}
        overflowY="scroll"
      >
        {nodeListToRender}
      </Flex>
    );
  };

  const searchKeyHandler = (e: KeyboardEvent<HTMLDivElement>) => {
    const { key } = e;
    let nextIndex = 0;

    if (key === 'ArrowDown') {
      setShowNodeList(true);
      nextIndex = (focusedIndex + 1) % nodes.length;
    }

    if (key === 'ArrowUp') {
      setShowNodeList(true);
      nextIndex = (focusedIndex + nodes.length - 1) % nodes.length;
    }

    // # TODO Handle Blur
    // if (key === 'Escape') {
    // }

    if (key === 'Enter') {
      const selectedNodeType = nodes[focusedIndex].type;
      addNode(selectedNodeType);
      setShowNodeList(false);
    }

    setFocusedIndex(nextIndex);
  };

  const searchInputBlurHandler = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setShowNodeList(false);
  };

  return (
    <Panel position="top-left">
      <Flex
        flexDirection="column"
        tabIndex={1}
        onKeyDown={searchKeyHandler}
        onFocus={() => setShowNodeList(true)}
        onBlur={searchInputBlurHandler}
        ref={nodeSearchRef}
      >
        <IAIInput
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setShowNodeList(true);
          }}
        />
        {showNodeList && renderNodeList()}
      </Flex>
    </Panel>
  );
};

export default memo(NodeSearch);
