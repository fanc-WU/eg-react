import { ANNOTATION_HEIGHT, LABEL_SIZE, GeneAnnotation } from './GeneAnnotation';
import PropTypes from 'prop-types';
import React from 'react';
import SvgComponent from '../SvgComponent';

const DEFAULT_MAX_ROWS = 4;
const ROW_BOTTOM_PADDING = 5;

/*
class GeneAnnotation {
    
    name: string;
    strand: string;
    start: number;
    end: number;
    exons: []
    
}
*/

class AnnotationArranger extends SvgComponent {
    shouldComponentUpdate(nextProps) {
        for (let propName in nextProps) {
            if (this.props[propName] !== nextProps[propName]) {
                return true;
            }
        }
        return false;
    }

    _filterAndSortGenes(genes) {
        let displayRegion = this.props.model.getAbsoluteRegion();
        let visibleGenes = genes.filter(gene => gene.start < displayRegion.end && gene.end > displayRegion.start);
        return visibleGenes.sort((gene1, gene2) => gene1.start - gene2.start);
    } // End _drawGene

    _addHiddenGenesReminder(numHiddenGenes) {
        if (numHiddenGenes > 0) {
            let maxRows = this.props.maxRows || DEFAULT_MAX_ROWS;
            let genesHiddenText = numHiddenGenes === 1 ? "1 gene unlabeled" : `${numHiddenGenes} genes unlabeled`;
            this.group.text(genesHiddenText).attr({
                x: 10,
                y: (maxRows) * (ANNOTATION_HEIGHT + ROW_BOTTOM_PADDING) + 5,
                "font-size": LABEL_SIZE,
                "font-style": "italic"
            });
        }
    }

    render() {
        this.group.clear();

        let children = [];
        let rowXExtents = new Array(this.props.maxRows).fill(-Number.MAX_VALUE);
        let genes = this._filterAndSortGenes(this.props.data);
        let numHiddenGenes = 0;
        let id = 0;
        for (let gene of genes) {
            // Label width is approximate; I don't feel like adding one to the DOM and checking its width.
            let labelWidth = gene.name.length * LABEL_SIZE;
            let startX = this.scale.baseToX(gene.start) - labelWidth;
            let row = rowXExtents.findIndex(rightmostX => startX > rightmostX);
            let isLabeled = true;
            if (startX < 0 || row === -1) {
                isLabeled = false;
                numHiddenGenes++;
                row = this.props.maxRows;
            } else {
                rowXExtents[row] = this.scale.baseToX(gene.end);
            }
            children.push(<GeneAnnotation
                svgNode={this.props.svgNode}
                model={this.props.model}
                xOffset={this.props.xOffset}
                yOffset={this.props.yOffset}
                gene={gene}
                isLabeled={isLabeled}
                topY={row * (ANNOTATION_HEIGHT + ROW_BOTTOM_PADDING)}
                onClick={this.props.onGeneClick}
                key={id++ /* TODO use a more robust id */}
            />);
        }
        this._addHiddenGenesReminder(numHiddenGenes);

        return <div>{children}</div>;
    }
}

AnnotationArranger.propTypes = {
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
    maxRows: PropTypes.number,
    onGeneClick: PropTypes.func
};

AnnotationArranger.defaultProps = {
    maxRows: DEFAULT_MAX_ROWS,
};

export default AnnotationArranger;