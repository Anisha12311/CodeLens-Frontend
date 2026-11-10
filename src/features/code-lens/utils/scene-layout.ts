import { Scene } from '../types/code-lens.types';
import { Drawing, DrawingBuilder } from './drawing-builder';
import { layoutPanels } from './panels-layout';

/** Lays out a scene `width` wide; panels grow downwards and record their height on the drawing. */
export function layoutScene(scene: Scene, width: number): Drawing {
  const draw = new DrawingBuilder();
  layoutPanels(scene.panels, width, draw);
  return draw.drawing;
}
