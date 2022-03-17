/* eslint-disable func-names */
import { expect } from 'chai';
import * as setupPolly from '../setup_polly';
import EasyPost from '../../src/easypost';
import Fixture from '../helpers/fixture';
import NotImplementedError from '../../src/errors/not_implemented';

describe('Batch Resource', function () {
  setupPolly.startPolly();

  before(function () {
    this.easypost = new EasyPost(process.env.EASYPOST_TEST_API_KEY);
  });

  beforeEach(function () {
    const { server } = this.polly;
    setupPolly.stripCreds(server);
  });

  it('creates a batch', async function () {
    const batch = await new this.easypost.Batch({
      shipments: [Fixture.oneCallBuyShipment()],
    }).save();

    expect(batch).to.be.an.instanceOf(this.easypost.Batch);
    expect(batch.id).to.match(/^batch_/);
    expect(batch.shipments).to.not.be.null;
  });

  it('retrieves a batch', async function () {
    const batch = await new this.easypost.Batch({
      shipments: [Fixture.oneCallBuyShipment()],
    }).save();
    const retrievedBatch = await this.easypost.Batch.retrieve(batch.id);

    expect(retrievedBatch).to.be.an.instanceOf(this.easypost.Batch);
    expect(retrievedBatch.id).to.equal(batch.id);
  });

  it('retrieves all batches', async function () {
    const batches = await this.easypost.Batch.all({ page_size: Fixture.pageSize() });

    const addressesArray = batches.batches;

    expect(addressesArray.length).to.be.lessThanOrEqual(Fixture.pageSize());
    expect(batches.has_more).to.not.be.null;
    addressesArray.forEach((batch) => {
      expect(batch).to.be.an.instanceOf(this.easypost.Batch);
    });
  });

  it('buys a batch', async function () {
    const batch = await new this.easypost.Batch({
      shipments: [Fixture.oneCallBuyShipment()],
    }).save();

    await batch.buy();

    expect(batch).to.be.an.instanceOf(this.easypost.Batch);
    expect(batch.num_shipments).to.equal(1);
  });

  it('creates a scanform for a batch', async function () {
    const batch = await new this.easypost.Batch({
      shipments: [Fixture.oneCallBuyShipment()],
    }).save();

    await batch.buy();

    // Uncomment the following line if you need to re-record the cassette
    // await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait enough time for the batch to process buying the shipment

    await batch.createScanForm();

    // We can't assert anything meaningful here because the scanform gets queued for generation and may not be immediately available
    expect(batch).to.be.an.instanceOf(this.easypost.Batch);
  });

  it('adds and removes shipments from a batch', async function () {
    const shipment1 = await new this.easypost.Shipment(Fixture.oneCallBuyShipment()).save();
    const shipment2 = await new this.easypost.Shipment(Fixture.oneCallBuyShipment()).save();
    const batch = await new this.easypost.Batch().save();

    const addShipmentsResponse = await batch.addShipments([shipment1.id, shipment2.id]);
    expect(addShipmentsResponse.num_shipments).to.equal(2);

    const removeShipmentsResponse = await batch.removeShipments([shipment1.id, shipment2.id]);
    expect(removeShipmentsResponse.num_shipments).to.equal(0);
  });

  it('generates a label for a batch', async function () {
    const batch = await new this.easypost.Batch({
      shipments: [Fixture.oneCallBuyShipment()],
    }).save();

    await batch.buy();

    // Uncomment the following line if you need to re-record the cassette
    // await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait enough time for the batch to process buying the shipment

    await batch.generateLabel('ZPL');

    // We can't assert anything meaningful here because the label gets queued for generation and may not be immediately available
    expect(batch).to.be.an.instanceOf(this.easypost.Batch);
  });

  it('throws on delete', function () {
    const batch = new this.easypost.Batch({ id: 1 });

    return batch.delete().catch((err) => {
      expect(err).to.be.an.instanceOf(NotImplementedError);
    });
  });
});
