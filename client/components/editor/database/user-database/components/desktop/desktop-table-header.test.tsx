/** @fileoverview Заголовок источника переключает численность аудитории от большей к меньшей и обратно. */
import {render,screen,fireEvent} from '@testing-library/react';
import {it,expect} from 'vitest';
import {DesktopTableHeader} from './desktop-table-header';
import {UserDirectoryControls,useDirectoryControls} from '../../content/user-directory-controls';
/** Показывает поле и направление, применённые реальным провайдером. */
function Order(){const value=useDirectoryControls();return <output>{value?.field}:{value?.direction}</output>;}
it('первым нажатием выбирает крупнейшие источники, следующим — самые редкие',()=>{
  render(<UserDirectoryControls><table><DesktopTableHeader /></table><Order /></UserDirectoryControls>);
  fireEvent.click(screen.getByRole('button',{name:'Источник: по убыванию'}));
  expect(screen.getByText('acquisitionSource:desc')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Источник: по возрастанию'}));
  expect(screen.getByText('acquisitionSource:asc')).toBeTruthy();
});
