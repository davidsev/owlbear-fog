import { customElement, query } from 'lit/decorators.js';
import { html } from 'lit';
import { BaseElement } from '../BaseElement';
import style from './BrushSizeForm.css';
import { baseCSS } from '../baseCSS';
import { toolMetadata } from '../../Metadata/ToolMetadata';

@customElement('brush-size-form')
export class BrushSizeForm extends BaseElement {

    static styles = baseCSS(style);

    @query('input')
    private accessor input!: HTMLInputElement;

    constructor () {
        super();

    }

    render () {
        return html`
            <main>
                <input type="range" min="0.4" max="2" step="0.1" value="${Math.sqrt(toolMetadata.data.radius * 2)}"
                       @change="${this.barChanged}"/>
            </main>
        `;
    }

    private barChanged () {
        toolMetadata.set({ radius: Math.pow(this.input.valueAsNumber, 2) / 2 });
    }
}

