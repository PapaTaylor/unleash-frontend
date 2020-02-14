import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Icon, Textfield, List, ListItem, ListItemContent, ListItemAction, Card, CardTitle, CardText, CardActions, Dialog, DialogActions, DialogContent, DialogTitle } from 'react-mdl';

import { SubSection, StepsBar } from './parts';

import { FormButtons } from '../common';
import { trim, updateWeight } from '../common/util';

import StrategyInputPercentage from '../feature/form/strategy-input-percentage';

import { styles as commonStyles } from '../common';
import styles from './styles.scss';

const payload = {
    type: 'exp',
    value: JSON.stringify({status: 'inital'})
};

class CreateExperimentComponent extends Component {
    static propTypes = {
        createExperiment: PropTypes.func.isRequired,
        validateName: PropTypes.func.isRequired,
    };

    constructor() {
        super();
        this.state = {
            experiment: { name: '', description: '', variants: [{ name: 'control', weight: 1000, payload}], rollout: 100 },
            errors: {},
            dirty: false,
            showAddVariant: false,
            newVariant: '',
        };
    }

    componentDidMount() {
        this.refs.name.inputRef.focus();
    }

    setValue = (field, value) => {
        const { experiment } = this.state;
        experiment[field] = value;
        this.setState({ experiment, dirty: true });
    };

    removeVariant = (name, evt) => {
        evt.preventDefault();
        if(name === 'control') {
            return;
        }
        const { experiment } = this.state;
        const variants = experiment.variants.filter(v => name !== v.name);
        experiment.variants = updateWeight(variants, 1000);
        this.setState({ experiment });
    };

    addVariant = (evt) => {
        evt.preventDefault();
        const { newVariant, experiment, errors } = this.state;
        const match = experiment.variants.filter(v => v.name === newVariant);
        if(match.length > 0) {
            errors.newVariant = 'A variant with that name already exist';
            this.setState({errors});
        } else if(!newVariant || newVariant.length === 0) {
            errors.newVariant = 'The variant must have a name';
            this.setState({errors});
        } else {
            const variants = experiment.variants.concat({name: newVariant, payload});
            experiment.variants = updateWeight(variants, 1000);
            this.setState({
                experiment,
                showAddVariant: false,
                newVariant: ''
            });
        }

    }

    validateName = async name => {
        const { errors } = this.state;
        try {
            await validateName(name);
            errors.name = undefined;
        } catch (err) {
            errors.name = err.message;
        }

        this.setState({ errors });
    };

    onCancel = evt => {
        evt.preventDefault();
        this.props.history.push('/experiments');
    };

    onSubmit = async evt => {
        evt.preventDefault();
        const { experiment, errors} = this.state;
        if(!experiment.name) {
            errors.name = 'Experiment id can not be empty.'
            this.setState({ errors });
        }
        try {
            await this.props.createExperiment(experiment);
            this.props.history.push('/experiments');
        } catch (e) {
            // do nothing
        }

    };

    showAddVariant = evt => {
        evt.preventDefault();
        this.setState({showAddVariant: true});
    }

    hideAddVariant = evt => {
        evt.preventDefault();
        this.setState({showAddVariant: false});
    }

    validateName = evt => {
    }

    render() {
        const { experiment, errors } = this.state;

        return (
            <div>
                <StepsBar />
                <Card shadow={0} className={commonStyles.fullwidth} style={{ overflow: 'visible' }}>
                    <CardTitle style={{ paddingTop: '24px', paddingBottom: '0', wordBreak: 'break-all' }}>
                        Define a new experiment
                    </CardTitle>
                    <CardText>
                        The first step is to define your experiment. You need to give it a unique experiment id and define the variants you want to use in your A/B/n Experiment. 
                    </CardText>
                    <form onSubmit={this.onSubmit}>
                        <section style={{ padding: '16px' }}>
                            <Textfield
                                floatingLabel
                                label="Experiment id"
                                name="name"
                                ref="name"
                                value={experiment.name}
                                error={errors.name}
                                onBlur={v => this.validateName(v.target.value)}
                                onChange={v => this.setValue('name', trim(v.target.value))}
                            />
                            <Textfield
                                floatingLabel
                                style={{ width: '100%' }}
                                rows={1}
                                label="Description"
                                name="description"
                                error={errors.description}
                                value={experiment.description}
                                onChange={v => this.setValue('description', v.target.value)}
                            />
                            <SubSection title="Variants">
                                <p style={{ color: 'rgba(0,0,0,.54)' }}>
                                    What do you want to test?
                                </p>
                                <List>
                                    {experiment.variants.map((v, i) => (
                                            <ListItem key={i}>
                                                <ListItemContent>
                                                    {v.name}
                                                </ListItemContent>
                                                <span className={styles.listItemWeight}>
                                                    {v.weight/10.0}%
                                                </span>
                                                <ListItemAction>
                                                    <a
                                                        href="#delete"
                                                        title="Remove variant"
                                                        onClick={this.removeVariant.bind(this, v.name)}
                                                    >
                                                        <Icon name="delete" />
                                                    </a>
                                                </ListItemAction>
                                            </ListItem>
                                        ))
                                    }
                                </List>
                                <Button onClick={this.showAddVariant} icon="add"><Icon name="add"></Icon> Add variant</Button>
                            </SubSection>

                            <SubSection title="Traffic allocation">
                                <p style={{ color: 'rgba(0,0,0,.54)' }}>
                                    How much traffic do you want to reserve for your experiment?
                                </p>
                                <div>
                                    <StrategyInputPercentage
                                        name="percentage"
                                        value={1 * experiment.rollout}
                                        minLabel="off"
                                        maxLabel="on"
                                        onChange={v => this.setValue('rollout', v.target.value)}
                                    />
                                </div>
                            </SubSection>
                        </section>
                        <CardActions>
                            <FormButtons submitText={'Create'} onCancel={this.onCancel} />
                        </CardActions>
                    </form>
                    <Dialog open={this.state.showAddVariant}>
                        <form onSubmit={this.addVariant}>
                            <DialogContent>
                                <Textfield
                                    floatingLabel
                                    style={{ width: '100%' }}
                                    label="Variant name"
                                    error={errors.newVariant}
                                    name="newVariant"
                                    value= {this.state.newVariant}
                                    onChange={e => this.setState({newVariant: trim(e.target.value)})}
                                />
                            </DialogContent>
                            <DialogActions>
                                <Button type='button' raised primary icon="add" onClick={this.addVariant}>Add variant</Button>
                                <Button type='button' onClick={this.hideAddVariant}>Close</Button>
                            </DialogActions>
                        </form>
                    </Dialog>
                </Card>
            </div>
        );
    }
}

export default CreateExperimentComponent;