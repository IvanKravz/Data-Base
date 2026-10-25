// components/divisions/DivisionDetails/sections/CommunicationPosts/PostCard.tsx
import React from 'react';
import { Plus, MapPin } from 'lucide-react';
import type { CommunicationPost, Facility } from '../../../../../types';
import './styles/FacilityCommunicationPostsPanel.css';

/** Узел дерева постов. */
export interface TreeNode extends CommunicationPost {
  children: TreeNode[];
}

interface PostCardProps {
  post: TreeNode;
  /** Объекты, к которым привязан корневой пост. Пустой массив — не привязан. */
  facilities?: Facility[];
  onAddPs: () => void;
  onAddNdr: (ps: TreeNode) => void;
  /** Открыть редактирование узла (корневой пост / ПС / НДР). */
  onEditNode: (id: string) => void;
  canAdd: boolean;
}

interface NodeRowProps {
  node: TreeNode;
  onClick?: () => void;
}

function NodeRow({ node, onClick }: NodeRowProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`post-node-row${onClick ? ' post-node-row--clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
    >
      <span className="post-node-row__name" title={node.name}>
        {node.name}
      </span>
    </div>
  );
}

export function PostCard({
  post,
  facilities = [],
  onAddPs,
  onAddNdr,
  onEditNode,
  canAdd,
}: PostCardProps) {
  // Клик по заголовку карточки: редактируем корневой пост (П/КП)
  const handleTitleClick = () => {
    onEditNode(String(post.id));
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTitleClick();
    }
  };

  // Привязанные объекты и их адреса
  const facilityEntries = facilities.map(f => ({
    id: String(f.id),
    name: f.name || 'Объект',
    address: (f as any).address as string | null | undefined,
  }));

  return (
    <article className="post-card">
      <header
        className="post-card__header post-card__header--clickable"
        onClick={handleTitleClick}
        onKeyDown={handleTitleKeyDown}
        role="button"
        tabIndex={0}
        title="Редактировать пост"
      >
        <h3 className="post-card__title" title={post.name}>
          {post.name}
        </h3>
      </header>

      {/* Адрес(а) привязанного объекта под шапкой */}
      <div className="post-card__facility">
        {facilityEntries.length > 0 ? (
          facilityEntries.map((f, idx) => (
            <div key={f.id || idx} className="post-card__facility-item">
              <MapPin size={12} className="post-card__facility-icon" />
              {facilityEntries.length > 1 && (
                <span className="post-card__facility-name">{f.name}:</span>
              )}
              <span className="post-card__facility-address">
                {f.address || 'Адрес не указан'}
              </span>
            </div>
          ))
        ) : (
          <div className="post-card__facility-empty">Не привязан к объекту</div>
        )}
      </div>

      <div className="post-card__rows">
        {/* Шапка колонок */}
        <div className="post-card__row post-card__row--header">
          <div className="post-card__cell post-card__cell--ps">
            <span className="post-card__cell-label">Посты связи</span>
          </div>
          <div className="post-card__cell post-card__cell--ndr">
            <span className="post-card__cell-label">НДР</span>
          </div>
        </div>

        {/* Каждый ПС — отдельная строка со своей ячейкой НДР */}
        {post.children.map(ps => (
          <div className="post-card__row" key={ps.id}>
            <div className="post-card__cell post-card__cell--ps">
              <NodeRow
                node={ps}
                onClick={() => onEditNode(String(ps.id))}
              />
            </div>

            <div className="post-card__cell post-card__cell--ndr">
              {ps.children.map(ndr => (
                <NodeRow
                  key={ndr.id}
                  node={ndr}
                  onClick={() => onEditNode(String(ndr.id))}
                />
              ))}

              {canAdd && (
                <button
                  type="button"
                  className="post-card__add-dashed"
                  onClick={() => onAddNdr(ps)}
                  title={`Добавить НДР к «${ps.name}»`}
                >
                  <Plus size={14} />
                  <span>НДР</span>
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Кнопка добавления нового ПС */}
        {canAdd && (
          <div className="post-card__row post-card__row--add">
            <div className="post-card__cell post-card__cell--ps">
              <button
                type="button"
                className="post-card__add-dashed"
                onClick={onAddPs}
                title="Добавить пост связи"
              >
                <Plus size={14} />
                <span>ПС</span>
              </button>
            </div>
            <div className="post-card__cell post-card__cell--ndr" />
          </div>
        )}
      </div>
    </article>
  );
}