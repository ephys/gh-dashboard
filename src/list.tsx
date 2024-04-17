import type { ComponentProps, ReactNode } from 'react';
import css from './list.module.scss';

export interface ListColumn<T extends object> {
  align?: ComponentProps<'td'>['align'];
  id: string;
  renderCell(data: T, index: number): ReactNode;
}

export interface ListProps<T extends object> {
  columns: ReadonlyArray<ListColumn<T>>;
  data: readonly T[];
  getRowKey?(row: T, index: number): string;
}

export function List<T extends object>(props: ListProps<T>) {
  return (
    <table className={css.list} cellSpacing="0">
      <tbody>
        {props.data.map((row, rowIndex) => (
          <tr key={props.getRowKey?.(row, rowIndex) ?? rowIndex}>
            {props.columns.map(column => (
              <td key={column.id} className={css.cell} align={column.align}>
                {column.renderCell(row, rowIndex)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
