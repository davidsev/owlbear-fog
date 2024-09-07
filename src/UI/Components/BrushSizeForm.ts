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

        toolMetadata.get().then((metadata) => {
            console.log('metadata', metadata, toolMetadata.key);
            this.input.valueAsNumber = Math.log(metadata.radius * 2);
            this.input.readOnly = false;
        });
    }

    render () {
        return html`
            <main>
                <input type="range" min="0.4" max="2" step="0.1" readonly @change="${this.barChanged}"/>
            </main>
        `;
    }

    private barChanged () {
        console.log('barChanged', this.input.valueAsNumber);
        toolMetadata.set({ radius: Math.pow(this.input.valueAsNumber, Math.E) / 2 });
    }
}
